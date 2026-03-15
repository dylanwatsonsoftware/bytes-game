class SwipeDetector {
    constructor(element) {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.element = element;
        this.init();
    }

    init() {
        this.element.addEventListener('touchstart', (e) => this.touchStart(e));
        this.element.addEventListener('touchmove', (e) => this.touchMove(e));
        this.element.addEventListener('touchend', (e) => this.touchEnd(e));
    }

    touchStart(event) {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
    }

    touchMove(event) {
        // Prevent scrolling while swiping
        event.preventDefault();
    }

    touchEnd(event) {
        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        const threshold = 30;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
            if (deltaX > 0) {
                this.onSwipeRight();
            } else {
                this.onSwipeLeft();
            }
        } else if (Math.abs(deltaY) > threshold) {
            if (deltaY > 0) {
                this.onSwipeDown();
            } else {
                this.onSwipeUp();
            }
        }
    }

    onSwipeLeft() {
        console.log('Swiped left!');
    }

    onSwipeRight() {
        console.log('Swiped right!');
    }

    onSwipeUp() {
        console.log('Swiped up!');
    }

    onSwipeDown() {
        console.log('Swiped down!');
    }
}

// Example usage:
// const swipeDetector = new SwipeDetector(document.getElementById('myElement'));