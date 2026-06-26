package expo.modules.cameraprobe

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CameraProbeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CameraProbe")

    Function("getCameraInfo") {
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context unavailable")
      return@Function CameraEnumerator.enumerate(context)
    }

    View(Camera2PreviewView::class) {
      Events("onStatus", "onPhoto", "onZoom")

      Prop("cameraId") { view: Camera2PreviewView, id: String ->
        view.setCameraId(id)
      }

      Prop("physicalCameraId") { view: Camera2PreviewView, id: String? ->
        view.setPhysicalCameraId(id)
      }

      Prop("active") { view: Camera2PreviewView, active: Boolean ->
        view.setActive(active)
      }

      Prop("captureTag") { view: Camera2PreviewView, tag: Int ->
        view.setCaptureTag(tag)
      }

      Prop("zoom") { view: Camera2PreviewView, zoom: Float ->
        view.setZoom(zoom)
      }

      Prop("flash") { view: Camera2PreviewView, flash: String ->
        view.setFlash(flash)
      }
    }
  }
}
