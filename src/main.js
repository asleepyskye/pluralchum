import './styles.js';
import { initializeSettings } from './data.js';
import { requireEula } from './eula.js';
import { patchMessageContent, patchMessageHeader, patchMessage } from './messages.js';
import { patchEditMenuItem, patchEditAction } from './edit.js';
import { settingsPanel } from './settingsPanel.js';
import { ValueCell, pluginName } from './utility.js';
import { checkForUpdates, upgradeCache } from './update.js';
import { patchBotPopout } from './popout.js';
import { PluralchumCache } from './cache.js';

const Logger = BdApi.Logger;
const version = '2.6.0';

export class Pluralchum {
  patches = [];

  start() {
    this.settings = initializeSettings();

    Logger.log(pluginName, 'Loaded settings')

    this.cache = new PluralchumCache();
    this.cache.init();

    Logger.log(pluginName, 'Loaded PK data');

    requireEula(this.settings);

    this.enabled = new ValueCell(true);

    patchMessageContent(this.settings, this.cache, this.enabled);
    patchMessageHeader(this.settings, this.cache, this.enabled);
    patchMessage(this.cache, this.enabled);
    this.patches.push(patchEditMenuItem());
    patchEditAction();
    patchBotPopout(this.cache);

    checkForUpdates(version);
  }

  stop() {
    this.enabled.set(false);

    for (let i = this.patches.length - 1; i >= 0; i--) this.patches[i]();

    this.cache.purgeOld();
    this.cache.close();

    BdApi.Patcher.unpatchAll(pluginName);
  }

  getSettingsPanel() {
    return settingsPanel(this.settings, this.cache);
  }

  getName() {
    return pluginName;
  }
}
