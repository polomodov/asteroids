export function createInput() {
  const down = new Set();
  const pressed = new Set();

  const keyToAction = (code) => {
    switch (code) {
      case 'ArrowLeft':
      case 'KeyA': return 'left';
      case 'ArrowRight':
      case 'KeyD': return 'right';
      case 'ArrowUp':
      case 'KeyW': return 'thrust';
      case 'Space': return 'shoot';
      case 'Escape': return 'pause';
      case 'Enter': return 'start';
      case 'KeyM': return 'mute';
      default: return null;
    }
  };

  function onKeyDown(e) {
    const action = keyToAction(e.code);
    if (!action) return;
    if (e.repeat) {
      // ignore repeats for pressed-once actions
      if (action === 'pause' || action === 'start' || action === 'mute') return;
    }
    down.add(action);
    pressed.add(action);
    if (action !== 'shoot') e.preventDefault();
  }

  function onKeyUp(e) {
    const action = keyToAction(e.code);
    if (!action) return;
    down.delete(action);
    if (action !== 'shoot') e.preventDefault();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    isDown(action) { return down.has(action); },
    wasPressed(action) {
      const had = pressed.has(action);
      if (had) pressed.delete(action);
      return had;
    },
    nextFrame() {
      // clear one-shot pressed except those still held if needed
      // Keep pressed for shoot to allow continuous fire control by cooldown
      pressed.delete('pause');
      pressed.delete('start');
      pressed.delete('mute');
    },
  };
}

