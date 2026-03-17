import Phaser from 'phaser';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create() {
        this.score = 0;
        this.junkHit = 0;
        this.gameOver = false;
        this.bgSpeed = 2;

        const { width, height } = this.scale;

        // Background
        this.bg = this.add.tileSprite(0, 0, width, height, 'bg').setOrigin(0, 0);
        // Scale background to cover the height
        const bgScale = Math.max(width / this.bg.width, height / this.bg.height);
        this.bg.setTileScale(bgScale, bgScale);

        // UI
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontFamily: 'Courier',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(10);

        this.junkText = this.add.text(20, 60, 'Junk Hits: 0/3', {
            fontFamily: 'Courier',
            fontSize: '32px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(10);

        // Player (South Park style split face for chomp animation since we only have 1 frame)
        // We will create a container for the physics body
        this.playerContainer = this.add.container(100, height / 2);
        this.playerContainer.setSize(100, 100);
        this.physics.world.enable(this.playerContainer);
        const body = this.playerContainer.body;
        body.setCollideWorldBounds(true);
        // Shrink the hitbox slightly for better gameplay feel
        body.setSize(100, 100);
        body.setOffset(-50, -50);

        // oscar2.png is 496x503; mouth is ~63% down the image
        const pw = 496;
        const ph = 503;
        const pScale = 150 / ph;
        const splitY = Math.round(ph * 0.70); // ~352px — middle of open mouth

        this.playerHead = this.add.image(0, 0, 'player')
            .setCrop(0, 0, pw, splitY)
            .setOrigin(0.5, 0.5)
            .setScale(pScale);

        this.playerJaw = this.add.image(0, 0, 'player')
            .setCrop(0, splitY, pw, ph - splitY)
            .setOrigin(0.5, 0.5)
            .setScale(pScale);

        this.playerContainer.add([this.playerHead, this.playerJaw]);

        // Input Setup
        this.cursors = this.input.keyboard.createCursorKeys();

        // Swipe controls for mobile
        this.swipe = { active: false, startY: 0, currentY: 0 };
        this.setupMobileControls();

        // Food groups
        this.foods = this.physics.add.group();
        this.junkFoods = this.physics.add.group();

        // Overlap detection
        this.physics.add.overlap(this.playerContainer, this.foods, this.eatFood, null, this);
        this.physics.add.overlap(this.playerContainer, this.junkFoods, this.hitJunk, null, this);

        // Spawning timer
        this.spawnTimer = this.time.addEvent({
            delay: 1500,
            callback: this.spawnItem,
            callbackScope: this,
            loop: true
        });
    }

    update(time, delta) {
        if (this.gameOver) return;

        // Background scroll
        this.bg.tilePositionX += this.bgSpeed;

        // Movement
        const speed = 400;
        this.playerContainer.body.setVelocityY(0);

        if (this.cursors.up.isDown) {
            this.playerContainer.body.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.playerContainer.body.setVelocityY(speed);
        } else if (this.swipe.active) {
            const dy = this.swipe.currentY - this.swipe.startY;
            const factor = Phaser.Math.Clamp(dy / 80, -1, 1);
            this.playerContainer.body.setVelocityY(factor * speed);
        }

        // Cleanup offscreen items
        this.foods.children.each((child) => {
            if (child && child.x < -100) child.destroy();
        });
        this.junkFoods.children.each((child) => {
            if (child && child.x < -100) child.destroy();
        });
    }

    setupMobileControls() {
        this.input.on('pointerdown', (pointer) => {
            this.swipe.active = true;
            this.swipe.startY = pointer.y;
            this.swipe.currentY = pointer.y;
        });

        this.input.on('pointermove', (pointer) => {
            if (this.swipe.active) {
                this.swipe.currentY = pointer.y;
            }
        });

        this.input.on('pointerup', () => {
            this.swipe.active = false;
        });
    }

    spawnItem() {
        if (this.gameOver) return;

        const { width, height } = this.scale;

        // 70% chance healthy, 30% chance junk
        const isJunk = Math.random() < 0.3;

        // Pick a texture
        const healthyAssets = ['apple', 'carrot'];
        const junkAssets = ['burger', 'pizza'];

        const key = isJunk
            ? junkAssets[Math.floor(Math.random() * junkAssets.length)]
            : healthyAssets[Math.floor(Math.random() * healthyAssets.length)];

        // Random Y position, keep within screen bounds roughly
        const spawnY = Phaser.Math.Between(100, height - 100);

        // 15% chance of golden item (healthy only)
        const isGolden = !isJunk && Math.random() < 0.15;

        const group = isJunk ? this.junkFoods : this.foods;
        const item = group.create(width + 100, spawnY, key);

        // Set scale so it's not huge (assuming 1024/512px generations)
        const dummy = this.textures.get(key).getSourceImage();
        const targetSize = isJunk ? 120 : 100;
        item.setScale(targetSize / dummy.height);

        if (isGolden) {
            item.isGolden = true;
            item.setTint(0xFFD700);
            // Pulse scale to stand out
            this.tweens.add({
                targets: item,
                scaleX: item.scaleX * 1.18,
                scaleY: item.scaleY * 1.18,
                duration: 350,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Physics settings
        item.body.setSize(item.width * 0.6, item.height * 0.6); // Slightly forgiving hitbox
        item.body.setVelocityX(Phaser.Math.Between(-250, -400));

        // Hover animation (sine wave Y)
        this.tweens.add({
            targets: item,
            y: item.y + Phaser.Math.Between(-30, 30),
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    animateChomp() {
        if (this._isChomping) return;
        this._isChomping = true;

        // Rotate each half around the mouth seam (center of the full image) so it looks like a mouth opening
        this.tweens.add({
            targets: this.playerHead,
            rotation: -0.3,
            duration: 100,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => { this.playerHead.rotation = 0; }
        });

        this.tweens.add({
            targets: this.playerJaw,
            rotation: 0.3,
            duration: 100,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.playerJaw.rotation = 0;
                this._isChomping = false;
            }
        });
    }

    eatFood(player, food) {
        const isGolden = food.isGolden;
        const points = isGolden ? 20 : 10;
        food.destroy();
        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);
        this.animateChomp();

        // Flash gold for golden items, green for normal
        this.scoreText.setColor(isGolden ? '#FFD700' : '#00ff00');
        this.time.delayedCall(200, () => {
            if (this.scoreText && this.scoreText.active) {
                this.scoreText.setColor('#ffffff');
            }
        });

        // Floating +points text
        const px = this.playerContainer.x + 30;
        const py = this.playerContainer.y - 40;
        const floatText = this.add.text(px, py, `+${points}`, {
            fontFamily: 'Courier', fontSize: '28px',
            color: isGolden ? '#FFD700' : '#00ff00',
            stroke: '#000000', strokeThickness: 3,
        }).setDepth(20);
        this.tweens.add({
            targets: floatText,
            y: py - 60,
            alpha: 0,
            duration: 700,
            ease: 'Cubic.easeOut',
            onComplete: () => floatText.destroy(),
        });
    }

    hitJunk(player, junk) {
        junk.destroy();
        this.junkHit += 1;
        this.junkText.setText(`Junk Hits: ${this.junkHit}/3`);
        this.animateChomp();

        // Red flash
        this.cameras.main.flash(200, 255, 0, 0);

        if (this.junkHit >= 3) {
            this.triggerGameOver();
        }
    }

    triggerGameOver() {
        this.gameOver = true;
        this.physics.pause();
        this.spawnTimer.remove();

        // Small delay so they can see the final hit, then show leaderboard
        this.time.delayedCall(500, () => {
            this.scene.start('GameOver', { score: this.score });
        });
    }
}
