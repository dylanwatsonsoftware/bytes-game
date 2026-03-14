import Phaser from 'phaser';

export class TitleScreen extends Phaser.Scene {
    constructor() {
        super('TitleScreen');
    }

    create() {
        const { width, height } = this.cameras.main;

        const titleText = this.add.text(width / 2, height / 2 - 50, 'Bytes Game', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const startButton = this.add.text(width / 2, height / 2 + 50, 'Click to Start', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#aaaaaa'
        }).setOrigin(0.5);
        startButton.setInteractive({ useHandCursor: true });

        startButton.on('pointerdown', () => {
            console.log('Start game clicked!');
            // Transition to Game scene when built
        });

        startButton.on('pointerover', () => startButton.setColor('#ffffff'));
        startButton.on('pointerout', () => startButton.setColor('#aaaaaa'));
    }
}
