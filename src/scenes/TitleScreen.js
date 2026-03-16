import Phaser from 'phaser';

export class TitleScreen extends Phaser.Scene {
    constructor() {
        super('TitleScreen');
    }

    create() {
        const { width, height } = this.scale;
        const dpr = window.devicePixelRatio || 1;

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
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 5, fill: true },
            resolution: dpr,
        }).setOrigin(0.5);

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
            strokeThickness: 4,
            resolution: dpr,
        }).setOrigin(0.5);

        this.tweens.add({
            targets: startButton,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        startButton.setInteractive({ useHandCursor: true });

        // Version label + changelog as DOM overlay
        this.createVersionDOM();

        // Click anywhere to start (changelog clicks are handled in DOM)
        this.input.on('pointerdown', () => {
            if (this.changelogOpen) {
                this.setChangelogVisible(false);
                return;
            }
            this.removeVersionDOM();
            this.scene.start('Game');
        });
    }

    createVersionDOM() {
        this.changelogOpen = false;

        const wrapper = document.createElement('div');
        Object.assign(wrapper.style, {
            position: 'absolute',
            top: '8px',
            left: '10px',
            right: '10px',
            fontFamily: 'Courier, monospace',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.65)',
            textAlign: 'right',
            zIndex: '1000',
            userSelect: 'none',
            lineHeight: '1.4',
            pointerEvents: 'none',
        });

        const label = document.createElement('div');
        label.style.cursor = 'pointer';
        label.style.pointerEvents = 'auto';
        label.innerHTML = `${__COMMIT_DATE__}<br><span style="display:block;max-width:calc(100vw - 20px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${__COMMIT_SUBJECT__}</span>`;
        label.addEventListener('click', (e) => {
            e.stopPropagation();
            this.setChangelogVisible(!this.changelogOpen);
        });
        label.addEventListener('mouseenter', () => label.style.color = 'rgba(255,255,255,1)');
        label.addEventListener('mouseleave', () => label.style.color = 'rgba(255,255,255,0.65)');

        const popup = document.createElement('div');
        Object.assign(popup.style, {
            display: 'none',
            marginTop: '6px',
            background: 'rgba(0,0,0,0.88)',
            border: '1px solid #335577',
            borderRadius: '4px',
            padding: '8px 0',
            textAlign: 'left',
            pointerEvents: 'auto',
        });

        __RECENT_COMMITS__.forEach((commit, i) => {
            const row = document.createElement('div');
            Object.assign(row.style, {
                display: 'flex',
                gap: '10px',
                padding: '5px 12px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
            });

            const date = document.createElement('span');
            date.textContent = commit.date;
            date.style.color = '#668899';
            date.style.flexShrink = '0';

            const subject = document.createElement('span');
            subject.textContent = commit.subject;
            subject.style.color = i === 0 ? '#ffdd44' : '#cccccc';
            subject.style.overflow = 'hidden';
            subject.style.textOverflow = 'ellipsis';

            row.appendChild(date);
            row.appendChild(subject);
            popup.appendChild(row);
        });

        wrapper.appendChild(label);
        wrapper.appendChild(popup);
        document.body.appendChild(wrapper);

        this.versionDOM = wrapper;
        this.changelogPopupDOM = popup;
    }

    setChangelogVisible(visible) {
        this.changelogOpen = visible;
        this.changelogPopupDOM.style.display = visible ? 'block' : 'none';
    }

    removeVersionDOM() {
        if (this.versionDOM && this.versionDOM.parentNode) {
            this.versionDOM.parentNode.removeChild(this.versionDOM);
            this.versionDOM = null;
        }
    }

    shutdown() {
        this.removeVersionDOM();
    }

    update(time, delta) {
        if (this.bg) {
            this.bg.tilePositionX += 0.5;
        }
    }
}
