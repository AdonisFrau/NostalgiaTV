/**
 * RemoteControl UI Module (TypeScript)
 */

interface IRemoteControl {
    init(): void;
}

// Extend Window interface for the global program switcher
declare global {
    interface Window {
        playNextProgram?: () => void;
        playPrevProgram?: () => void;
    }
}

class RemoteControlModule implements IRemoteControl {
    private isVisible: boolean = false;
    private remoteContainer: HTMLElement | null = null;
    private volume: number = 50;
    private isPaused: boolean = false;
    private readonly imageName: string = "/remote.png";

    public init(): void {
        this.injectStyles();
        this.createRemote();
        this.setupListeners();
    }

    private injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            #remote-container {
                position: fixed;
                bottom: -500px; /* Nudge state */
                left: -20px;
                width: 280px; /* Increased from 220px */
                height: 740px; /* Increased from 580px */
                background: url('${this.imageName}') no-repeat center center;
                background-size: contain;
                transition: all 0.7s cubic-bezier(0.19, 1, 0.22, 1);
                z-index: 9999;
                cursor: pointer;
                filter: drop-shadow(0 10px 30px rgba(0,0,0,0.7));
            }

            #remote-container.active {
                bottom: 50%;
                left: 30px;
                transform: translateY(50%);
                cursor: default;
            }

            .remote-hit-area {
                position: relative;
                width: 100%;
                height: 100%;
            }

            /* Invisible base button style */
            .btn-hit {
                position: absolute;
                background: rgba(255, 255, 255, 0.1); /* Made slightly visible */
                border: 2px solid rgba(255, 255, 255, 0.3);
                cursor: pointer;
                outline: none;
                transition: all 0.2s ease;
            }

            .btn-hit:hover {
                background: rgba(255, 255, 255, 0.3);
                border-color: rgba(255, 255, 255, 0.6);
                box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
            }

            .btn-hit:active {
                background: rgba(255, 255, 255, 0.4);
                transform: scale(0.95);
            }

            /* D-PAD MAPPING */
            .hz-up     { top: 18.5%; left: 42%; width: 16%; height: 6%; border-radius: 10px; }
            .hz-down   { top: 29.5%; left: 42%; width: 16%; height: 6%; border-radius: 10px; }
            .hz-left   { top: 23%; left: 34%; width: 9%;  height: 8%; border-radius: 50%; }
            .hz-right  { top: 23%; left: 57%; width: 9%;  height: 8%; border-radius: 50%; }
            .hz-center { top: 22.5%; left: 44.5%; width: 11%; height: 9%; border-radius: 50%; }
            
            /* ACTION BUTTONS */
            .hz-pause  { top: 50%; left: 35%; width: 30%; height: 5%; border-radius: 15px; }
            
            /* VOLUME ROCKER */
            .vol-up    { top: 56%; left: 36%; width: 28%; height: 6%; border-radius: 10px 10px 0 0; }
            .vol-down  { top: 64%; left: 36%; width: 28%; height: 6%; border-radius: 0 0 10px 10px; }

            /* KEYPAD GRID */
            .keypad-zone {
                position: absolute;
                top: 74%;
                left: 21%;
                width: 58%;
                height: 18%;
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
            }

            .key-hit {
                background: transparent;
                border: none;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }

    private createRemote(): void {
        const root = document.createElement('div');
        root.id = 'remote-control-root';

        root.innerHTML = `
            <div id="remote-container">
                <div class="remote-hit-area">
                    <!-- D-Pad -->
                    <button class="btn-hit hz-up" data-action="up"></button>
                    <button class="btn-hit hz-down" data-action="down"></button>
                    <button class="btn-hit hz-left" data-action="prev"></button>
                    <button class="btn-hit hz-right" data-action="next"></button>
                    <button class="btn-hit hz-center" data-action="pause"></button>

                    <!-- Main Pause Pill -->
                    <button class="btn-hit hz-pause" data-action="pause"></button>

                    <!-- Volume Section -->
                    <button class="btn-hit vol-up" data-action="vol-up"></button>
                    <button class="btn-hit vol-down" data-action="vol-down"></button>

                    <!-- Number Pad -->
                    <div class="keypad-zone">
                        ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="key-hit" data-num="${n}"></button>`).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(root);
        this.remoteContainer = document.getElementById('remote-container');
    }

    private sendYouTubeCommand(command: string, value?: any): void {
        const player = document.getElementById('videoPlayer') as HTMLIFrameElement;
        if (player?.contentWindow) {
            player.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: command,
                args: value !== undefined ? [value] : []
            }), '*');
        }
    }

    private togglePlayback(): void {
        this.isPaused = !this.isPaused;
        this.sendYouTubeCommand(this.isPaused ? 'pauseVideo' : 'playVideo');
        console.log(this.isPaused ? 'Paused' : 'Playing');
    }

    private adjustVolume(delta: number): void {
        this.volume = Math.max(0, Math.min(100, this.volume + delta));
        this.sendYouTubeCommand('setVolume', this.volume);
        console.log(`Volume: ${this.volume}%`);
    }

    private setupListeners(): void {
        if (!this.remoteContainer) return;

        this.remoteContainer.addEventListener('click', (e) => {
            if (!this.isVisible) {
                this.remoteContainer?.classList.add('active');
                this.isVisible = true;
                e.stopPropagation();
            }
        });

        this.remoteContainer.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.isVisible) return;
                e.stopPropagation();

                const action = btn.getAttribute('data-action');
                const num = btn.getAttribute('data-num');

                if (num) console.log(`Keypad: ${num}`);

                switch (action) {
                    case 'pause': this.togglePlayback(); break;
                    case 'vol-up': this.adjustVolume(10); break;
                    case 'vol-down': this.adjustVolume(-10); break;
                    case 'next':
                        if (window.playNextProgram) window.playNextProgram();
                        break;
                    case 'prev':
                        if (window.playPrevProgram) window.playPrevProgram();
                        break;
                    default: if (action) console.log(`Action: ${action}`);
                }
            });
        });

        document.addEventListener('click', () => {
            if (this.isVisible) {
                this.remoteContainer?.classList.remove('active');
                this.isVisible = false;
            }
        });
    }
}

export const RemoteControl = new RemoteControlModule();
RemoteControl.init();