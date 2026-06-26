package expo.modules.cameraprobe

import android.content.Context
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import android.util.SizeF
import kotlin.math.atan
import kotlin.math.hypot
import kotlin.math.roundToInt

/**
 * Pure Camera2 enumeration. Surfaces EVERYTHING the OS knows about — including
 * the "hidden" physical cameras that sit behind a logical multi-camera and that
 * CameraX / vision-camera / expo-camera never expose as selectable devices.
 *
 * On Xiaomi/Poco the 0.6x ultra-wide is almost always one of these hidden
 * physical cameras. This is the table that tells us its real id + focal length.
 */
object CameraEnumerator {

  fun enumerate(context: Context): Map<String, Any?> {
    val manager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    val result = ArrayList<Map<String, Any?>>()

    val publicIds = try {
      manager.cameraIdList.toList()
    } catch (e: Exception) {
      emptyList<String>()
    }

    val seen = LinkedHashSet<String>()

    // 1. Every publicly-listed camera (what CameraX-based libs can choose from).
    for (id in publicIds) {
      seen.add(id)
      try {
        val ch = manager.getCameraCharacteristics(id)
        result.add(describe(id, ch, kind = "public", parentLogicalId = null))

        // 2. The physical cameras hiding behind this logical camera.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
          val physicalIds = try {
            ch.physicalCameraIds
          } catch (e: Exception) {
            emptySet<String>()
          }
          for (pid in physicalIds) {
            if (publicIds.contains(pid)) continue // already described as public
            seen.add(pid)
            try {
              val pch = manager.getCameraCharacteristics(pid)
              result.add(describe(pid, pch, kind = "hidden-physical", parentLogicalId = id))
            } catch (e: Exception) {
              result.add(
                mapOf(
                  "id" to pid,
                  "kind" to "hidden-physical",
                  "parentLogicalId" to id,
                  "error" to (e.message ?: e.toString())
                )
              )
            }
          }
        }
      } catch (e: Exception) {
        result.add(mapOf("id" to id, "kind" to "public", "error" to (e.message ?: e.toString())))
      }
    }

    // 3. Brute-force: many Xiaomi/Poco/Realme devices keep extra physical cameras
    // (the ultra-wide, macro, depth) OUT of cameraIdList on purpose, yet still
    // answer getCameraCharacteristics() — and sometimes openCamera() — for those
    // numeric ids. Probe 0..23 directly to surface anything hidden from the list.
    val bruteFound = ArrayList<String>()
    for (n in 0..23) {
      val id = n.toString()
      if (seen.contains(id)) continue
      try {
        val ch = manager.getCameraCharacteristics(id)
        seen.add(id)
        bruteFound.add(id)
        result.add(describe(id, ch, kind = "hidden-bruteforce", parentLogicalId = null))
      } catch (e: Exception) {
        // id genuinely doesn't exist / not accessible — expected for most numbers
      }
    }

    return mapOf(
      "androidApiLevel" to Build.VERSION.SDK_INT,
      "manufacturer" to Build.MANUFACTURER,
      "model" to Build.MODEL,
      "publicCameraIds" to publicIds,
      "bruteForceFoundIds" to bruteFound,
      "cameras" to result
    )
  }

  private fun describe(
    id: String,
    ch: CameraCharacteristics,
    kind: String,
    parentLogicalId: String?
  ): Map<String, Any?> {
    val facingInt = ch.get(CameraCharacteristics.LENS_FACING)
    val facing = when (facingInt) {
      CameraCharacteristics.LENS_FACING_FRONT -> "front"
      CameraCharacteristics.LENS_FACING_BACK -> "back"
      CameraCharacteristics.LENS_FACING_EXTERNAL -> "external"
      else -> "unknown"
    }

    val focalLengths = ch.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS)
    val sensorSize: SizeF? = ch.get(CameraCharacteristics.SENSOR_INFO_PHYSICAL_SIZE)

    var horizontalFovDeg: Double? = null
    var equiv35mm: Double? = null
    val primaryFocal = focalLengths?.minOrNull() // shortest focal = widest lens
    if (primaryFocal != null && sensorSize != null && sensorSize.width > 0f) {
      horizontalFovDeg = Math.toDegrees(2.0 * atan((sensorSize.width / (2.0 * primaryFocal))))
      val diagonal = hypot(sensorSize.width.toDouble(), sensorSize.height.toDouble())
      if (diagonal > 0) {
        // 43.27mm = diagonal of a 36x24 full-frame sensor.
        equiv35mm = (primaryFocal * (43.27 / diagonal))
      }
    }

    val hwLevel = when (ch.get(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL)) {
      CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY -> "LEGACY"
      CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LIMITED -> "LIMITED"
      CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_FULL -> "FULL"
      CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_3 -> "LEVEL_3"
      else -> "EXTERNAL/unknown"
    }

    val capabilities = ch.get(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES)?.toList() ?: emptyList()
    val isLogicalMultiCam = capabilities.contains(
      CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_LOGICAL_MULTI_CAMERA
    )

    val maxDigitalZoom = ch.get(CameraCharacteristics.SCALER_AVAILABLE_MAX_DIGITAL_ZOOM)

    var zoomRatioMin: Float? = null
    var zoomRatioMax: Float? = null
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val range = ch.get(CameraCharacteristics.CONTROL_ZOOM_RATIO_RANGE)
      if (range != null) {
        zoomRatioMin = range.lower
        zoomRatioMax = range.upper
      }
    }

    val physicalIds = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      try {
        ch.physicalCameraIds.toList()
      } catch (e: Exception) {
        emptyList()
      }
    } else emptyList()

    return mapOf(
      "id" to id,
      "kind" to kind,
      "parentLogicalId" to parentLogicalId,
      "facing" to facing,
      "focalLengthsMm" to (focalLengths?.map { round2(it.toDouble()) } ?: emptyList<Double>()),
      "sensorWidthMm" to sensorSize?.width?.let { round2(it.toDouble()) },
      "sensorHeightMm" to sensorSize?.height?.let { round2(it.toDouble()) },
      "horizontalFovDeg" to horizontalFovDeg?.let { round2(it) },
      "equivalent35mm" to equiv35mm?.let { round2(it) },
      "hardwareLevel" to hwLevel,
      "isLogicalMultiCamera" to isLogicalMultiCam,
      "physicalCameraIds" to physicalIds,
      "maxDigitalZoom" to maxDigitalZoom?.let { round2(it.toDouble()) },
      "zoomRatioMin" to zoomRatioMin?.let { round2(it.toDouble()) },
      "zoomRatioMax" to zoomRatioMax?.let { round2(it.toDouble()) }
    )
  }

  private fun round2(v: Double): Double = (v * 100).roundToInt() / 100.0
}
