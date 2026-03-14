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

        // Display parts of the face
        // Use a dummy image just to get the dimensions
        const dummy = this.textures.get('player').getSourceImage();
        const pw = dummy.width;
        const ph = dummy.height;

        // Scale to a reasonable avatar size, e.g. 150px
        const pScale = 150 / ph;

        // Use standard images since setCrop works on Images, and we scale them
        this.playerHead = this.add.image(0, 0, 'player')
            .setCrop(0, 0, pw, ph / 2)
            .setOrigin(0.5, 1) // Origin at bottom center of the top half
            .setScale(pScale);

        this.playerJaw = this.add.image(0, 0, 'player')
            .setCrop(0, ph / 2, pw, ph / 2)
            .setOrigin(0.5, 0) // Origin at top center of the bottom half
            .setScale(pScale);

        this.playerContainer.add([this.playerHead, this.playerJaw]);

        // Input Setup
        // We can use up/down arrows
        this.cursors = this.input.keyboard.createCursorKeys();

        // Also add pointer input (for touch/mouse)
        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown && !this.gameOver) {
                // Move towards pointer Y
                this.moveToY(pointer.y);
            }
        });

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

        // Keyboard Movement
        const speed = 400;
        this.playerContainer.body.setVelocityY(0);

        if (this.cursors.up.isDown) {
            this.playerContainer.body.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.playerContainer.body.setVelocityY(speed);
        }

        // Cleanup offscreen items
        this.foods.children.each((child) => {
            if (child && child.x < -100) child.destroy();
        });
        this.junkFoods.children.each((child) => {
            if (child && child.x < -100) child.destroy();
        });
    }

    moveToY(targetY) {
        // Simple Lerp or move towards
        const currentY = this.playerContainer.y;
        const diff = targetY - currentY;
        if (Math.abs(diff) > 5) {
            this.playerContainer.body.setVelocityY(diff * 5);
        }
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

        const group = isJunk ? this.junkFoods : this.foods;
        const item = group.create(width + 100, spawnY, key);

        // Set scale so it's not huge (assuming 1024/512px generations)
        const dummy = this.textures.get(key).getSourceImage();
        const targetSize = isJunk ? 120 : 100;
        item.setScale(targetSize / dummy.height);

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
        // Quick Pacman/South Park split jaw animation!
        if (this._isChomping) return;
        this._isChomping = true;

        this.tweens.add({
            targets: this.playerHead,
            y: -15,
            duration: 100,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: this.playerJaw,
            y: 15,
            duration: 100,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this._isChomping = false;
            }
        });
    }

    eatFood(player, food) {
        food.destroy();
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
        this.animateChomp();

        // Quick flash effect for points
        this.scoreText.setColor('#00ff00');
        this.time.delayedCall(200, () => {
            if (this.scoreText && this.scoreText.active) {
                this.scoreText.setColor('#ffffff');
            }
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

        const { width, height } = this.scale;

        // Dark overlay
        this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0).setDepth(100);

        // Game Over Text
        this.add.text(width / 2, height / 2 - 50, 'GAME OVER', {
            fontFamily: 'Courier',
            fontSize: '64px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(101);

        const restartButton = this.add.text(width / 2, height / 2 + 50, 'Click to Restart', {
            fontFamily: 'Courier',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(101);

        restartButton.setInteractive({ useHandCursor: true });
        restartButton.on('pointerdown', () => {
            this.scene.restart();
        });
        restartButton.on('pointerover', () => restartButton.setColor('#ffff00'));
        restartButton.on('pointerout', () => restartButton.setColor('#ffffff'));
    }
}
