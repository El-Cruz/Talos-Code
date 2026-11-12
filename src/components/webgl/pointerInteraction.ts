import * as THREE from "three";

export function pointerToNDC(clientX: number, clientY: number,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">, target: THREE.Vector2) {
  if (!rect.width || !rect.height) return false;
  // DOM bounds and client coordinates both use CSS pixels; never multiply by DPR.
  target.set((clientX - rect.left) / rect.width * 2 - 1, 1 - (clientY - rect.top) / rect.height * 2);
  return Math.abs(target.x) <= 1 && Math.abs(target.y) <= 1;
}

export function createPointerProjector() {
  // Conservative local-space proxies for the baked monitor/stand, keyboard and mouse.
  // Three box intersections per frame, never a CPU raycast over thousands of points.
  const bounds = [
    new THREE.Box3(new THREE.Vector3(-1.51, -1.7, -.86), new THREE.Vector3(1.51, 1.16, .86)),
    new THREE.Box3(new THREE.Vector3(-1.32, -2.13, .79), new THREE.Vector3(1.08, -1.61, 1.91)),
    new THREE.Box3(new THREE.Vector3(1.25, -2.04, .99), new THREE.Vector3(1.85, -1.60, 1.81)),
  ];
  const caster = new THREE.Raycaster(), localRay = new THREE.Ray();
  const inverseModel = new THREE.Matrix4(), plane = new THREE.Plane();
  const hit = new THREE.Vector3(), nearest = new THREE.Vector3();
  const normal = new THREE.Vector3(), center = new THREE.Vector3();
  return (ndc: THREE.Vector2, camera: THREE.PerspectiveCamera, model: THREE.Matrix4, viewTarget: THREE.Vector3) => {
    caster.setFromCamera(ndc, camera);
    localRay.copy(caster.ray).applyMatrix4(inverseModel.copy(model).invert());
    let distance = Infinity;
    for (const box of bounds) {
      if (localRay.intersectBox(box, hit)) {
        const d = hit.distanceToSquared(localRay.origin);
        if (d < distance) { distance = d; nearest.copy(hit); }
      }
    }
    if (distance < Infinity) viewTarget.copy(nearest).applyMatrix4(model);
    else {
      // Keep background input on a camera-facing plane when the workstation is missed.
      camera.getWorldDirection(normal);
      plane.setFromNormalAndCoplanarPoint(normal, center.setFromMatrixPosition(model));
      if (!caster.ray.intersectPlane(plane, viewTarget)) return false;
    }
    viewTarget.applyMatrix4(camera.matrixWorldInverse);
    return true;
  };
}
