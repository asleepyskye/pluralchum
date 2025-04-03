const React = BdApi.React;

export class ValueCell {
  #val;
  #listeners = [];

  constructor(val) {
    this.#val = val;
  }

  get() {
    return this.#val;
  }

  set(x) {
    this.update(function () {
      return x;
    });
  }

  update(f) {
    let old = this.#val;
    let current = f(old);
    this.#val = current;
    if (old !== current) {
      this.#listeners.forEach(function (listener) {
        listener(current);
      });
    }
  }

  addListener(f) {
    this.#listeners.push(f);

    // removeListener function
    return function () {
      let index = this.#listeners.indexOf(f);
      this.#listeners.splice(index, 1);
    }.bind(this);
  }
}

export class MapCell {
  #map;
  #listeners = [];

  constructor(map) {
    this.#map = map;
  }

  get(key) {
    if (Object.hasOwn(this.#map, key)) {
      return this.#map[key];
    } else {
      return null;
    }
  }

  set(key, value) {
    this.update(key, function () {
      return value;
    });
  }

  entries() {
    return Object.entries(this.#map);
  }

  update(key, f) {
    let old = this.get(key);
    let current = f(old);
    this.#map[key] = current;
    if (old !== current) {
      this.#listeners.forEach(function (listener) {
        listener(key, current);
      });
    }
  }

  addListener(f) {
    this.#listeners.push(f);

    // removeListener function
    return function () {
      let index = this.#listeners.indexOf(f);
      this.#listeners.splice(index, 1);
    }.bind(this);
  }

  delete(key) {
    delete this.#map[key];
    this.#listeners.forEach(function (listener) {
      listener(key, null);
    });
  }

  clear() {
    this.#map = {};
    this.#listeners.forEach(function (listener) {
      listener(null, null);
    });
  }
}

export function hookupValueCell(cell) {
  const [value, setValue] = React.useState(cell.get());
  React.useEffect(function () {
    return cell.addListener(setValue);
  });

  return [value, setValue];
}

export function isProxiedMessage(message) {
  return message.webhookId !== null;
}

export async function sleep(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

export function dummy() {
  return new Proxy(dummy, {
    apply: dummy,
    get: dummy,
  });
}

export const pluginName = 'Pluralchum';
