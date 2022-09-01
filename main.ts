import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { Pulse } from "./src/pulse";
import { CodeStatsAPI } from "./src/code-stats-api";

interface CodeStatsSettings {
    API_KEY: string | null;
    USER_NAME: string | null;
    UPDATE_URL: string;
}

const DEFAULT_SETTINGS: CodeStatsSettings = {
    API_KEY: null,
    USER_NAME: null,
    UPDATE_URL: "https://codestats.net/api/",
}

export default class CodeStatsPlugin extends Plugin {
    settings: CodeStatsSettings;

    private pulse: Pulse;
    private api: CodeStatsAPI;
    private updateTimeout: any;

    private statusBarItemEl: HTMLElement;

    // wait 10s after each change in the document before sending an update
    private UPDATE_DELAY = 10000;

    async onload() {
        await this.loadSettings();
        this.pulse = new Pulse();
        this.initAPI();

        // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
        this.statusBarItemEl = this.addStatusBarItem();
        this.statusBarItemEl.setText('CodeStats: ...');

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new CodeStatsSettingTab(this.app, this));

        this.app.workspace.on("editor-change", (editor: Editor, MarkdownView: MarkdownView) => {
            this.updateXpCount(1);
        })

        // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
        // Using this function will automatically remove the event listener when this plugin is disabled.
        // this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
        //     console.log('click', evt);
        // });

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        // this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
    }

    onunload() {

    }

    public updateXpCount(changeCount: number): void {
        this.pulse.addXP("Obsidian", changeCount);

        this.updateStatusBar(`${this.pulse.getTotalXP()}`);

        // each change resets the timeout so we only send updates when there is a 10s delay in updates to the document
        if (this.updateTimeout !== null) {
            clearTimeout(this.updateTimeout);
        }

        this.updateTimeout = setTimeout(() => {
            const promise = this.api.sendUpdate(this.pulse);

            if (promise !== null) {
                promise.then(() => {
                    this.updateStatusBar(`${this.pulse.getTotalXP()}`);
                });
            }
        }, this.UPDATE_DELAY);
    }

    private updateStatusBar(changeCount: string): void {
        this.statusBarItemEl.setText(`C::S ${changeCount}`);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private initAPI() {
        if (this.api != null)
            this.api.updateSettings(this.settings.API_KEY, this.settings.UPDATE_URL, this.settings.USER_NAME);
        else
            this.api = new CodeStatsAPI(this.settings.API_KEY, this.settings.UPDATE_URL, this.settings.USER_NAME);
    }
}

class CodeStatsSettingTab extends PluginSettingTab {
    plugin: CodeStatsPlugin;

    constructor(app: App, plugin: CodeStatsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Settings for codestats' });

        new Setting(containerEl)
            .setName('API key')
            .setDesc('CodeStats API key')
            .addText(text => text
                .setPlaceholder('Enter your api key')
                .setValue(this.plugin.settings.API_KEY || "")
                .onChange(async (value) => {
                    this.plugin.settings.API_KEY = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Username')
            .setDesc('CodeStats username')
            .addText(text => text
                .setPlaceholder('Enter your username')
                .setValue(this.plugin.settings.USER_NAME || "")
                .onChange(async (value) => {
                    this.plugin.settings.USER_NAME = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Update url')
            .setDesc('CodeStats update url (if you use custom server)')
            .addText(text => text
                .setPlaceholder('Enter codestats update url')
                .setValue(this.plugin.settings.UPDATE_URL)
                .onChange(async (value) => {
                    this.plugin.settings.UPDATE_URL = value;
                    await this.plugin.saveSettings();
                }));
    }
}
