import Phaser from 'phaser';

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Load default assets
        this.load.svg('player', 'assets/player.svg', { width: 500, height: 500 });
        this.load.image('apple', 'assets/apple.png');
        this.load.image('carrot', 'assets/carrot.png');
        this.load.image('burger', 'assets/burger.png');
        this.load.image('pizza', 'assets/pizza.png');
        this.load.image('bg', 'assets/bg.png');

        // Simple loading bar
        const { width, height } = this.cameras.main;
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });
    }

    create() {
        this.scene.start('TitleScreen');
    }
}
