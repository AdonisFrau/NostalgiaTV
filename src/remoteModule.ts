/**
 * RemoteControl UI Module (TypeScript)
 * Inspired by ChatGPT Image May 1, 2026, 04_46_13 PM.jpg
 */

interface IRemoteControl {
    init(): void;
}

class RemoteControlModule implements IRemoteControl {
    private isVisible: boolean = false;
    private remoteContainer: HTMLElement | null = null;
    private volume: number = 50;

    public init(): void {
        this.injectStyles();
        this.createRemote();
        this.setupListeners();
    }

    private injectStyles(): void {
        const style: HTMLStyleElement = document.createElement('style');
        style.textContent = `
            :root {
                --remote-silver: #c0c0c0;
                --remote-dark: #2a2a2a;
                --remote-blue: #2b3a8c;
            }

            #remote-container {
                position: fixed;
                bottom: -540px; 
                left: 20px;
                width: 180px;
                height: 600px;
                background: var(--remote-dark);
                border-radius: 40px 40px 20px 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.6);
                transition: all 0.7s cubic-bezier(0.19, 1, 0.22, 1);
                z-index: 9999;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px 0;
                border: 1px solid #444;
            }

            #remote-container.active {
                bottom: 50%;
                left: 40px;
                transform: translateY(50%);
                cursor: default;
            }

            .remote-face {
                width: 88%;
                height: 92%;
                background: linear-gradient(180deg, #d1d1d1 0%, #8e8e8e 100%);
                border-radius: 35px 35px 120px 120px;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding-top: 30px;
            }

            .d-pad {
                position: relative;
                width: 130px;
                height: 130px;
                background: var(--remote-blue);
                border-radius: 50%;
                display: grid;
                grid-template-areas: 
                    ". up ."
                    "left center right"
                    ". down .";
                padding: 5px;
                border: 4px solid #1a1a1a;
            }

            .d-pad button {
                background: transparent;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 14px;
            }

            .btn-center { 
                grid-area: center; 
                border: 2px solid rgba(255,255,255,0.4) !important;
                border-radius: 50%;
                font-size: 10px !important;
                font-weight: bold;
            }

            .paused-btn {
                margin-top: 25px;
                width: 60px;
                height: 25px;
                background: var(--remote-blue);
                border: none;
                border-radius: 12px;
                color: white;
                font-size: 9px;
                font-weight: bold;
                cursor: pointer;
            }

            /* 🔊 VOLUME ROCKER */
            .volume-rocker {
                margin-top: 25px;
                width: 70px;
                height: 60px;
                background: var(--remote-blue);
                border-radius: 12px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                padding: 6px 0;
                border: 1px solid #111;
            }

            .volume-rocker button {
                width: 100%;
                height: 22px;
                background: transparent;
                border: none;
                color: white;
                font-size: 14px;
                cursor: pointer;
                transition: transform 0.1s;
            }

            .volume-rocker button:active {
                transform: scale(0.9);
            }

            .vol-display {
                font-size: 10px;
                opacity: 0.8;
                color: white;
                pointer-events: none;
            }

            .keypad {
                margin-top: 40px;
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
            }

            .key-btn {
                width: 32px;
                height: 22px;
                background: #333;
                color: #ccc;
                border: none;
                border-radius: 4px;
                font-size: 11px;
            }
        `;
        document.head.appendChild(style);
    }

    private createRemote(): void {
        const root: HTMLDivElement = document.createElement('div');
        root.id = 'remote-control-root';

        root.innerHTML = `
            <div id="remote-container">
                <div class="remote-face">

                    <div class="d-pad">
                        <button class="btn-up" data-action="up">▲</button>
                        <button class="btn-left" data-action="left">◀</button>
                        <button class="btn-center" data-action="select">SELECT</button>
                        <button class="btn-right" data-action="right">▶</button>
                        <button class="btn-down" data-action="down">▼</button>
                    </div>

                    <button class="paused-btn" data-action="pause">PAUSE</button>

                    <!-- 🔊 Volume Rocker -->
                    <div class="volume-rocker">
                        <button data-action="vol-up">▲</button>
                        <div class="vol-display">VOL</div>
                        <button data-action="vol-down">▼</button>
                    </div>

                    <div class="keypad">
                        ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="key-btn">${n}</button>`).join('')}
                    </div>

                </div>
            </div>
        `;

        document.body.appendChild(root);
        this.remoteContainer = document.getElementById('remote-container');
    }

    private updateVolume(change: number): void {
        this.volume = Math.max(0, Math.min(100, this.volume + change));
        console.log(`Volume: ${this.volume}%`);
    }

    private setupListeners(): void {
        if (!this.remoteContainer) return;

        // Open remote
        this.remoteContainer.addEventListener('click', (e: MouseEvent) => {
            if (!this.isVisible) {
                this.remoteContainer?.classList.add('active');
                this.isVisible = true;
                e.stopPropagation();
            }
        });

        // Button handling
        const buttons = this.remoteContainer.querySelectorAll<HTMLButtonElement>('button');

        buttons.forEach(btn => {
            btn.addEventListener('click', (e: MouseEvent) => {
                if (!this.isVisible) return;
                e.stopPropagation();

                const action = btn.getAttribute('data-action');

                switch (action) {
                    case 'vol-up':
                        this.updateVolume(+10);
                        break;

                    case 'vol-down':
                        this.updateVolume(-10);
                        break;

                    default:
                        if (action) console.log(action);
                        break;
                }
            });
        });

        // Close on outside click
        document.addEventListener('click', () => {
            if (this.isVisible) {
                this.remoteContainer?.classList.remove('active');
                this.isVisible = false;
            }
        });
    }
}

// Export and Initialize
export const RemoteControl = new RemoteControlModule();
RemoteControl.init();