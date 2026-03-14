import Phaser from 'phaser';

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Load default assets here, similar to snorkel-to-the-bottom Boot loader
    }

    create() {
        this.scene.start('TitleScreen');
    }
}
