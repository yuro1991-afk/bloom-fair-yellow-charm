export const ADDON_FILENAME = "omni_forge_bridge.py";

export const BLENDER_ADDON = `# Omni-Forge Bridge — Blender 3.6 / 4.x addon
# Edit > Preferences > Add-ons > Install this file, then enable it.
# Set Host + Token in the add-on preferences (copy them from the deck).

bl_info = {
    "name": "Omni-Forge Bridge",
    "author": "Omni-Forge",
    "version": (1, 0, 0),
    "blender": (3, 6, 0),
    "location": "3D Viewport > Sidebar > Forge",
    "description": "Pulls compiled Omni-Forge jobs and executes them in bpy.",
    "category": "Import-Export",
}

import json
import traceback
import urllib.error
import urllib.request
import bpy
from bpy.props import StringProperty, FloatProperty, BoolProperty

_timer = None


def _prefs():
    return bpy.context.preferences.addons[__name__].preferences


def _url(path):
    host = _prefs().host.rstrip("/")
    return host + path


def _headers():
    return {
        "Content-Type": "application/json",
        "X-Forge-Token": _prefs().token.strip(),
    }


def _post(path, payload, timeout=8):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(_url(path), data=data, headers=_headers(), method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.loads(res.read().decode("utf-8"))


def hello():
    prefs = _prefs()
    if not prefs.host or not prefs.token:
        return None
    try:
        return _post("/api/v1/bridge", {
            "action": "hello",
            "token": prefs.token.strip(),
            "blender": bpy.app.version_string,
            "addon": "1.0.0",
        })
    except Exception as exc:
        print("forge hello failed:", exc)
        return None


def pull_and_run():
    prefs = _prefs()
    if not prefs.enabled or not prefs.token:
        return
    try:
        data = _post("/api/v1/bridge", {
            "action": "pull",
            "token": prefs.token.strip(),
        })
    except Exception as exc:
        print("forge pull failed:", exc)
        return
    job = data.get("job")
    if not job:
        return
    logs = []
    ok = True
    try:
        ns = {"bpy": bpy, "__name__": "__forge_job__"}
        exec(job.get("bpy") or "print('empty job')", ns, ns)
        logs.append("exec ok · " + (job.get("name") or job.get("id")))
    except Exception:
        ok = False
        logs.append(traceback.format_exc()[-800:])
    try:
        _post("/api/v1/bridge", {
            "action": "result",
            "token": prefs.token.strip(),
            "jobId": job.get("id"),
            "ok": ok,
            "logs": logs,
        })
    except Exception as exc:
        print("forge result failed:", exc)


def _tick():
    pull_and_run()
    return max(0.8, float(_prefs().interval))


class ForgePrefs(bpy.types.AddonPreferences):
    bl_idname = __name__
    host: StringProperty(name="Host", default="http://127.0.0.1:8080")
    token: StringProperty(name="Token", default="")
    interval: FloatProperty(name="Poll (s)", default=1.5, min=0.5, max=10)
    enabled: BoolProperty(name="Pull jobs", default=True)

    def draw(self, context):
        col = self.layout.column()
        col.prop(self, "host")
        col.prop(self, "token")
        col.prop(self, "interval")
        col.prop(self, "enabled")


class FORGE_OT_hello(bpy.types.Operator):
    bl_idname = "forge.hello"
    bl_label = "Ping deck"
    def execute(self, context):
        data = hello()
        self.report({"INFO" if data else "WARNING"}, "Forge hello" if data else "Hello failed")
        return {"FINISHED"}


class FORGE_OT_pull(bpy.types.Operator):
    bl_idname = "forge.pull"
    bl_label = "Pull job now"
    def execute(self, context):
        pull_and_run()
        return {"FINISHED"}


class FORGE_PT_panel(bpy.types.Panel):
    bl_label = "Omni-Forge"
    bl_idname = "FORGE_PT_panel"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Forge"
    def draw(self, context):
        col = self.layout.column()
        col.operator("forge.hello")
        col.operator("forge.pull")
        col.label(text="Token in Add-on Preferences")


def register():
    bpy.utils.register_class(ForgePrefs)
    bpy.utils.register_class(FORGE_OT_hello)
    bpy.utils.register_class(FORGE_OT_pull)
    bpy.utils.register_class(FORGE_PT_panel)
    global _timer
    if _timer is None:
        hello()
        _timer = bpy.app.timers.register(_tick, first_interval=1.0, persistent=True)


def unregister():
    global _timer
    _timer = None
    bpy.utils.unregister_class(FORGE_PT_panel)
    bpy.utils.unregister_class(FORGE_OT_pull)
    bpy.utils.unregister_class(FORGE_OT_hello)
    bpy.utils.unregister_class(ForgePrefs)


if __name__ == "__main__":
    register()
`;
