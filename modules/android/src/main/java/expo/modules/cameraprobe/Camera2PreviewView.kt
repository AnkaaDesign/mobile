package expo.modules.cameraprobe

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.ImageFormat
import android.graphics.SurfaceTexture
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.params.OutputConfiguration
import android.hardware.camera2.params.SessionConfiguration
import android.media.ImageReader
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.util.Range
import android.util.Size
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import android.view.Surface
import android.view.TextureView
import androidx.core.content.ContextCompat
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.Executors

/**
 * Raw Camera2 preview + still capture. Opens a chosen LOGICAL camera and —
 * when a physicalCameraId is supplied — streams/captures that specific physical
 * sensor via OutputConfiguration.setPhysicalCameraId(). This is the path that
 * unlocks the hidden ultra-wide (0.6x) on Xiaomi/Poco that no JS camera lib
 * can reach.
 */
@SuppressLint("ViewConstructor")
class Camera2PreviewView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

  val onStatus by EventDispatcher()
  val onPhoto by EventDispatcher()
  val onZoom by EventDispatcher()

  private val textureView = TextureView(context)
  private var cameraDevice: CameraDevice? = null
  private var captureSession: CameraCaptureSession? = null
  private var imageReader: ImageReader? = null
  private var previewRequestBuilder: CaptureRequest.Builder? = null
  private var backgroundThread: HandlerThread? = null
  private var backgroundHandler: Handler? = null

  private var cameraId: String? = null
  private var physicalCameraId: String? = null
  private var active: Boolean = false
  private var lastCaptureTag: Int = 0

  // Zoom state (CONTROL_ZOOM_RATIO, API 30+).
  private var zoomRatio: Float = 1f
  private var zoomMin: Float = 1f
  private var zoomMax: Float = 1f
  private val scaleDetector: ScaleGestureDetector

  private val manager: CameraManager =
    context.getSystemService(Context.CAMERA_SERVICE) as CameraManager

  init {
    scaleDetector = ScaleGestureDetector(context, object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
      override fun onScale(detector: ScaleGestureDetector): Boolean {
        applyZoom(zoomRatio * detector.scaleFactor)
        return true
      }
    })
    addView(textureView)
    textureView.surfaceTextureListener = object : TextureView.SurfaceTextureListener {
      override fun onSurfaceTextureAvailable(s: SurfaceTexture, w: Int, h: Int) {
        maybeStart()
      }

      override fun onSurfaceTextureSizeChanged(s: SurfaceTexture, w: Int, h: Int) {}
      override fun onSurfaceTextureDestroyed(s: SurfaceTexture): Boolean {
        closeCamera()
        return true
      }

      override fun onSurfaceTextureUpdated(s: SurfaceTexture) {}
    }
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    textureView.layout(0, 0, right - left, bottom - top)
  }

  @SuppressLint("ClickableViewAccessibility")
  override fun onTouchEvent(event: MotionEvent): Boolean {
    scaleDetector.onTouchEvent(event)
    return true
  }

  override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
    // Grab multi-touch so the pinch reaches us even over the TextureView child.
    return event.pointerCount > 1
  }

  fun setCameraId(id: String) {
    if (cameraId != id) {
      cameraId = id
      restart()
    }
  }

  fun setPhysicalCameraId(id: String?) {
    val normalized = if (id.isNullOrBlank()) null else id
    if (physicalCameraId != normalized) {
      physicalCameraId = normalized
      restart()
    }
  }

  fun setActive(value: Boolean) {
    if (active != value) {
      active = value
      if (active) maybeStart() else closeCamera()
    }
  }

  /** Bumping this tag from JS triggers a still capture. */
  fun setCaptureTag(tag: Int) {
    if (tag > 0 && tag != lastCaptureTag) {
      lastCaptureTag = tag
      capture()
    }
  }

  /** Set zoom ratio directly from JS (tap presets). 0 or negative = ignore. */
  fun setZoom(ratio: Float) {
    if (ratio > 0f) applyZoom(ratio)
  }

  private fun applyZoom(requested: Float) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return
    val clamped = requested.coerceIn(zoomMin, zoomMax)
    zoomRatio = clamped
    val builder = previewRequestBuilder ?: return
    val session = captureSession ?: return
    try {
      builder.set(CaptureRequest.CONTROL_ZOOM_RATIO, clamped)
      session.setRepeatingRequest(builder.build(), null, backgroundHandler)
      onZoom(
        mapOf<String, Any>(
          "zoom" to clamped,
          "min" to zoomMin,
          "max" to zoomMax
        )
      )
    } catch (e: Exception) {
      emit("error", "zoom failed: ${e.message}")
    }
  }

  private fun emit(status: String, detail: String? = null) {
    onStatus(
      mapOf<String, Any>(
        "status" to status,
        "cameraId" to (cameraId ?: ""),
        "physicalCameraId" to (physicalCameraId ?: ""),
        "detail" to (detail ?: "")
      )
    )
  }

  private fun restart() {
    closeCamera()
    maybeStart()
  }

  private fun startBackgroundThread() {
    if (backgroundThread != null) return
    backgroundThread = HandlerThread("Camera2Preview").also { it.start() }
    backgroundHandler = Handler(backgroundThread!!.looper)
  }

  private fun stopBackgroundThread() {
    backgroundThread?.quitSafely()
    try {
      backgroundThread?.join()
    } catch (e: InterruptedException) {
      // ignore
    }
    backgroundThread = null
    backgroundHandler = null
  }

  @SuppressLint("MissingPermission")
  private fun maybeStart() {
    val id = cameraId ?: return
    if (!active) return
    if (!textureView.isAvailable) return
    if (cameraDevice != null) return

    if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
      != PackageManager.PERMISSION_GRANTED
    ) {
      emit("error", "CAMERA permission not granted")
      return
    }

    startBackgroundThread()

    try {
      manager.openCamera(id, object : CameraDevice.StateCallback() {
        override fun onOpened(device: CameraDevice) {
          cameraDevice = device
          emit("opened", "Logical camera $id opened")
          createPreviewSession(device)
        }

        override fun onDisconnected(device: CameraDevice) {
          device.close()
          cameraDevice = null
          emit("disconnected")
        }

        override fun onError(device: CameraDevice, error: Int) {
          device.close()
          cameraDevice = null
          emit("error", "openCamera error code $error")
        }
      }, backgroundHandler)
    } catch (e: Exception) {
      emit("error", "openCamera threw: ${e.message}")
    }
  }

  private fun characteristicsFor(id: String): CameraCharacteristics? =
    try {
      manager.getCameraCharacteristics(id)
    } catch (e: Exception) {
      null
    }

  private fun choosePreviewSize(id: String): Size {
    val ch = characteristicsFor(id) ?: return Size(1280, 720)
    val map = ch.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
    val sizes = map?.getOutputSizes(SurfaceTexture::class.java)
    return sizes?.filter { it.width <= 1920 && it.height <= 1080 }
      ?.maxByOrNull { it.width.toLong() * it.height } ?: Size(1280, 720)
  }

  private fun chooseJpegSize(id: String): Size {
    val ch = characteristicsFor(id) ?: return Size(1920, 1080)
    val map = ch.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
    val sizes = map?.getOutputSizes(ImageFormat.JPEG)
    // Cap at ~8MP to stay safe across HALs while keeping good detail.
    return sizes?.filter { it.width.toLong() * it.height <= 8_000_000L }
      ?.maxByOrNull { it.width.toLong() * it.height }
      ?: sizes?.minByOrNull { it.width.toLong() * it.height }
      ?: Size(1920, 1080)
  }

  private fun createPreviewSession(device: CameraDevice) {
    val texture = textureView.surfaceTexture ?: run {
      emit("error", "no surface texture")
      return
    }
    val sizingId = physicalCameraId ?: cameraId ?: "0"
    val previewSize = choosePreviewSize(sizingId)
    texture.setDefaultBufferSize(previewSize.width, previewSize.height)
    val previewSurface = Surface(texture)

    val jpegSize = chooseJpegSize(sizingId)
    val reader = ImageReader.newInstance(jpegSize.width, jpegSize.height, ImageFormat.JPEG, 2)
    reader.setOnImageAvailableListener({ r ->
      val image = r.acquireLatestImage() ?: return@setOnImageAvailableListener
      try {
        val buffer = image.planes[0].buffer
        val bytes = ByteArray(buffer.remaining())
        buffer.get(bytes)
        val file = File(context.cacheDir, "uw_${System.currentTimeMillis()}.jpg")
        FileOutputStream(file).use { it.write(bytes) }
        onPhoto(
          mapOf<String, Any>(
            "uri" to ("file://" + file.absolutePath),
            "width" to image.width,
            "height" to image.height
          )
        )
        emit("captured", "Saved ${image.width}x${image.height}")
      } catch (e: Exception) {
        emit("error", "save failed: ${e.message}")
      } finally {
        image.close()
      }
    }, backgroundHandler)
    imageReader = reader
    val readerSurface = reader.surface

    // Read this sensor's zoom-ratio range so pinch zoom is correctly bounded.
    val zoomRange: Range<Float>? =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
        characteristicsFor(sizingId)?.get(CameraCharacteristics.CONTROL_ZOOM_RATIO_RANGE)
      else null
    zoomMin = zoomRange?.lower ?: 1f
    zoomMax = zoomRange?.upper ?: 1f
    zoomRatio = zoomRatio.coerceIn(zoomMin, zoomMax)

    try {
      val requestBuilder = device.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW)
      requestBuilder.addTarget(previewSurface)
      requestBuilder.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        requestBuilder.set(CaptureRequest.CONTROL_ZOOM_RATIO, zoomRatio)
      }
      previewRequestBuilder = requestBuilder

      val sessionCallback = object : CameraCaptureSession.StateCallback() {
        override fun onConfigured(session: CameraCaptureSession) {
          captureSession = session
          try {
            session.setRepeatingRequest(requestBuilder.build(), null, backgroundHandler)
            onZoom(mapOf<String, Any>("zoom" to zoomRatio, "min" to zoomMin, "max" to zoomMax))
            emit(
              "streaming",
              if (physicalCameraId != null)
                "Streaming physical $physicalCameraId via logical $cameraId"
              else
                "Streaming logical camera $cameraId"
            )
          } catch (e: Exception) {
            emit("error", "setRepeatingRequest failed: ${e.message}")
          }
        }

        override fun onConfigureFailed(session: CameraCaptureSession) {
          emit(
            "error",
            "Session config FAILED" +
              (physicalCameraId?.let { " for physical id $it (device may block 3rd-party access)" } ?: "")
          )
        }
      }

      // API 28+: select a specific physical sensor behind the logical camera.
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && physicalCameraId != null) {
        val previewOut = OutputConfiguration(previewSurface).apply { setPhysicalCameraId(physicalCameraId) }
        val jpegOut = OutputConfiguration(readerSurface).apply { setPhysicalCameraId(physicalCameraId) }
        val sessionConfig = SessionConfiguration(
          SessionConfiguration.SESSION_REGULAR,
          listOf(previewOut, jpegOut),
          Executors.newSingleThreadExecutor(),
          sessionCallback
        )
        device.createCaptureSession(sessionConfig)
      } else {
        @Suppress("DEPRECATION")
        device.createCaptureSession(listOf(previewSurface, readerSurface), sessionCallback, backgroundHandler)
      }
    } catch (e: Exception) {
      emit("error", "createCaptureSession threw: ${e.message}")
    }
  }

  private fun capture() {
    val device = cameraDevice
    val session = captureSession
    val reader = imageReader
    if (device == null || session == null || reader == null) {
      emit("error", "capture: camera not ready")
      return
    }
    try {
      val builder = device.createCaptureRequest(CameraDevice.TEMPLATE_STILL_CAPTURE)
      builder.addTarget(reader.surface)
      builder.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE)
      builder.set(CaptureRequest.JPEG_QUALITY, 92.toByte())
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        builder.set(CaptureRequest.CONTROL_ZOOM_RATIO, zoomRatio)
      }
      session.capture(builder.build(), null, backgroundHandler)
    } catch (e: Exception) {
      emit("error", "capture failed: ${e.message}")
    }
  }

  private fun closeCamera() {
    try {
      captureSession?.close()
    } catch (e: Exception) {
    }
    captureSession = null
    previewRequestBuilder = null
    try {
      cameraDevice?.close()
    } catch (e: Exception) {
    }
    cameraDevice = null
    try {
      imageReader?.close()
    } catch (e: Exception) {
    }
    imageReader = null
    stopBackgroundThread()
  }
}
