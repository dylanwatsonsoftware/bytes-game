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

        // Version info in top-right corner
        const dateLabel = this.add.text(width - 10, 10, __COMMIT_DATE__, {
            fontFamily: 'Courier',
            fontSize: '14px',
            color: '#ffffff',
        }).setOrigin(1, 0).setAlpha(0.6).setInteractive({ useHandCursor: true });

        const maxSubjectWidth = width - 20;
        const subjectObj = this.add.text(width - 10, 28, __COMMIT_SUBJECT__, {
            fontFamily: 'Courier',
            fontSize: '14px',
            color: '#ffffff',
        }).setOrigin(1, 0).setAlpha(0.6);
        if (subjectObj.width > maxSubjectWidth) {
            let truncated = __COMMIT_SUBJECT__;
            while (truncated.length > 0 && subjectObj.width > maxSubjectWidth) {
                truncated = truncated.slice(0, -1);
                subjectObj.setText(truncated + '…');
            }
        }

        // Changelog popup (hidden by default)
        this.changelogOpen = false;
        this.changelogContainer = this.buildChangelogPopup(width);
        this.changelogContainer.setVisible(false);

        dateLabel.on('pointerover', () => dateLabel.setAlpha(1));
        dateLabel.on('pointerout', () => dateLabel.setAlpha(0.6));
        dateLabel.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            this.changelogOpen = !this.changelogOpen;
            this.changelogContainer.setVisible(this.changelogOpen);
        });

        // Can click anywhere on screen to start (or close changelog)
        this.input.on('pointerdown', () => {
            if (this.changelogOpen) {
                this.changelogOpen = false;
                this.changelogContainer.setVisible(false);
                return;
            }
            this.scene.start('Game');
        });
    }

    buildChangelogPopup(width) {
        const pad = 14;
        const rowH = 36;
        const commits = __RECENT_COMMITS__;
        const panelW = width - 20;
        const panelH = pad * 2 + commits.length * rowH;
        const panelX = width - 10;
        const panelY = 48;

        const container = this.add.container(0, 0).setDepth(10);

        const bg = this.add.rectangle(panelX, panelY, panelW, panelH, 0x000000, 0.88)
            .setOrigin(1, 0)
            .setStrokeStyle(1, 0x335577, 0.8);
        container.add(bg);

        const maxSubjectW = panelW - 180 - pad * 2;

        commits.forEach((commit, i) => {
            const y = panelY + pad + rowH * i + rowH / 2;
            const x = panelX - panelW + pad;

            const dateText = this.add.text(x, y, commit.date, {
                fontFamily: 'Courier', fontSize: '12px', color: '#668899',
            }).setOrigin(0, 0.5);
            container.add(dateText);

            const subjObj = this.add.text(x + 178, y, commit.subject, {
                fontFamily: 'Courier', fontSize: '13px', color: i === 0 ? '#ffdd44' : '#cccccc',
            }).setOrigin(0, 0.5);
            if (subjObj.width > maxSubjectW) {
                let t = commit.subject;
                while (t.length > 0 && subjObj.width > maxSubjectW) {
                    t = t.slice(0, -1);
                    subjObj.setText(t + '…');
                }
            }
            container.add(subjObj);
        });

        return container;
    }

    update(time, delta) {
        // Slowly scroll the background on the title screen too
        if (this.bg) {
            this.bg.tilePositionX += 0.5;
        }
    }
}
