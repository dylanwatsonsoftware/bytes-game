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
            .setOrigin(0.5, 0.5) // Center origin for seamless overlap
            .setScale(pScale);

        this.playerJaw = this.add.image(0, 0, 'player')
            .setCrop(0, ph / 2, pw, ph / 2)
            .setOrigin(0.5, 0.5) // Center origin for seamless overlap
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

        // Small delay so they can see the final hit, then show leaderboard
        this.time.delayedCall(500, () => {
            this.scene.start('GameOver', { score: this.score });
        });
    }
}
