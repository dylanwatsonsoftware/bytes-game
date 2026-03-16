import Phaser from 'phaser';

export class TitleScreen extends Phaser.Scene {
    constructor() {
        super('TitleScreen');
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.bg = this.add.tileSprite(0, 0, width, height, 'bg').setOrigin(0, 0);
        const bgScale = Math.max(width / this.bg.width, height / this.bg.height);
        this.bg.setTileScale(bgScale, bgScale);

        // Semi-transparent overlay to make text pop
        this.add.rectangle(0, 0, width, height, 0x000000, 0.4).setOrigin(0);

        const titleText = this.add.text(width / 2, height / 2 - 50, 'Bytes', {
            fontFamily: 'Courier',
            fontSize: '64px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 5, fill: true }
        }).setOrigin(0.5);

        // Simple pulsing animation for title
        this.tweens.add({
            targets: titleText,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const startButton = this.add.text(width / 2, height / 2 + 50, 'CLICK OR TAP TO START', {
            fontFamily: 'Courier',
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Blink start text
        this.tweens.add({
            targets: startButton,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        startButton.setInteractive({ useHandCursor: true });

        // Version info in bottom-right corner
        this.add.text(width - 10, height - 10, `${__COMMIT_DATE__} · ${__COMMIT_SUBJECT__} by ${__COMMIT_AUTHOR__}`, {
            fontFamily: 'Courier',
            fontSize: '14px',
            color: '#ffffff',
        }).setOrigin(1, 1).setAlpha(0.6);

        // Can click anywhere on screen to start
        this.input.on('pointerdown', () => {
            console.log('Start game clicked!');
            this.scene.start('Game');
        });
    }

    update(time, delta) {
        // Slowly scroll the background on the title screen too
        if (this.bg) {
            this.bg.tilePositionX += 0.5;
        }
    }
}
