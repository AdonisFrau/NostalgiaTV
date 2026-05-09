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
    private rootElement: HTMLElement | null = null;
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
            #remote-control-root {
                position: fixed;
                bottom: -520px;
                left: 16px;
                width: 340px;
                height: 760px;
                z-index: 9999;
                transition: bottom 0.7s cubic-bezier(0.19, 1, 0.22, 1), transform 0.7s ease;
                pointer-events: none;
            }

            #remote-control-root.active {
                bottom: 24px;
                transform: translateY(0);
                pointer-events: auto;
            }

            #remote-container {
                width: 100%;
                height: 100%;
                background: url('${this.imageName}') no-repeat center center;
                background-size: contain;
                position: relative;
                cursor: pointer;
                overflow: hidden;
                pointer-events: auto;
            }

            #remote-container .remote-panel {
                position: absolute;
                inset: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: none;
                background: transparent;
            }

            #remote-container .remote-panel > div {
                width: 100%;
                height: 100%;
                pointer-events: auto;
                background: transparent;
            }

            #remote-container .remote-hit-area {
                position: absolute;
                inset: 0;
                pointer-events: none;
            }

            #remote-container button,
            #remote-container .keypad-zone button {
                cursor: pointer;
                pointer-events: auto;
            }

            .btn-hit {
                position: absolute;
                background: transparent;
                /* border: 1px solid rgba(255, 255, 255, 0); */
                transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
                outline: none;
            }

            .btn-hit:hover {
                background: transparent;
            }

            .btn-hit:active {
                transform: scale(0.96);
            }

            .hz-up     { top: 22%; left: 42%; width: 16%; height: 7%; border-radius: 999px; }
            .hz-down   { top: 34%; left: 42%; width: 16%; height: 7%; border-radius: 999px; }
            .hz-left   { top: 28%; left: 34%; width: 8%; height: 12%; border-radius: 999px; }
            .hz-right  { top: 28%; left: 58%; width: 8%; height: 12%; border-radius: 999px; }
            .hz-center { top: 27%; left: 44.5%; width: 11%; height: 12%; border-radius: 999px; }
            .hz-pause  { top: 48%; left: 34%; width: 30%; height: 5.5%; border-radius: 999px; }
            .vol-up    { top: 56%; left: 36%; width: 28%; height: 6.5%; border-radius: 16px 16px 0 0; }
            .vol-down  { top: 64%; left: 36%; width: 28%; height: 6.5%; border-radius: 0 0 16px 16px; }

            .keypad-zone {
                position: absolute;
                top: 73%;
                left: 21%;
                width: 58%;
                height: 18%;
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
            }

            .key-hit {
                width: 100%;
                height: 100%;
                background: rgba(15, 23, 42, 0.9);
                border: 1px solid rgba(148, 163, 184, 0.25);
                /* border-radius: 999px; */
                transition: background 0.2s ease, transform 0.2s ease;
            }

            .key-hit:hover {
                background: rgba(51, 65, 85, 0.84);
            }

            .key-hit:active {
                transform: translateY(1px);
            }

            .remote-panel .w-64 {
                width: calc(100% - 20px);
                max-width: 280px;
                min-height: 680px;
                border-radius: 3rem;
                background: transparent;
                box-shadow: 0 25px 80px rgba(15, 23, 42, 0);
            }

            .remote-panel .shadow-inner {
                box-shadow: inset 0 2px 12px rgba(15, 23, 42, 0);
            }

            .remote-panel .border-x-4 {
                border-left: 4px solid rgba(51, 65, 85, 0);
                border-right: 4px solid rgba(51, 65, 85, 0);
            }

            .remote-panel .border-zinc-800 {
                border-color: rgba(30, 41, 59, 0);
            }

            .remote-panel .bg-gradient-to-b {
                /* background: linear-gradient(180deg, #a1a1aa 0%, #e4e4e7 50%, #a1a1aa 100%); */
                background: transparent;
            }

            .remote-panel .from-zinc-400,
            .remote-panel .via-zinc-200,
            .remote-panel .to-zinc-400 {
                /* preserved tailwind class names */
            }

            .remote-panel .text-blue-200\/50,
            .remote-panel .text-blue-100,
            .remote-panel .bg-blue-900 {
                background: transparent;
                /* color: #bfdbfe; */
                /* background: #0f172a; */
            }

            .remote-panel .text-zinc-400,
            .remote-panel .text-white {
                background: transparent;
                /* color: rgba(255, 255, 255, 0.92); */
            }

            .remote-panel .bg-zinc-800 {
                background: rgba(30, 41, 59, 0.95);
            }

            .remote-panel .rounded-full {
                border-radius: 9999px;
            }

            .remote-panel button {
                border: none;
            }

            .remote-panel span {
                color: rgba(148, 163, 184, 0.95);
            }

            #remote-container .direction-button {
                background: rgba(255, 255, 255, 0.08);
            }
        `;
        document.head.appendChild(style);
    }

    private createRemote(): void {
        const root = document.createElement('div');
        root.id = 'remote-control-root';

        root.innerHTML = `
            <div id="remote-container">
              <div class="remote-panel flex items-center justify-center min-h-screen p-10">
                <!-- Remote Chassis -->
                <div class="w-64 rounded-[3rem] p-4 shadow-2xl border-x-4 border-zinc-800 relative overflow-hidden">
                  
                  <!-- Metallic Inner Panel -->
                  <div class="bg-gradient-to-b from-zinc-400 via-zinc-200 to-zinc-400 rounded-[2.5rem] p-6 shadow-inner min-h-[600px] flex flex-col items-center gap-8">
                    
                    <!-- D-PAD / OLD RUBBER BLUE WHEEL -->
                    <div class="relative w-36 h-36 rounded-full shadow-[inset_0_4px_10px_rgba(0,0,0,0.6),0_2px_4px_rgba(255,255,255,0.2)] border-4 border-zinc-500/30 flex items-center justify-center overflow-hidden"
                         style="background: radial-gradient(circle, rgba(59,74,107,1) 0%, rgba(30,41,59,1) 100%), url('https://www.transparenttextures.com/patterns/carbon-fibre.png'); background-blend-mode: overlay;">
                      
                      <!-- Subtle "Worn" Scuff Overlay -->
                      <div class="absolute inset-0 opacity-20 pointer-events-none" style="background: radial-gradient(white 5%, transparent 80%);"></div>

                      <!-- Directional Buttons (Integrated into rubber) -->
                      <button class="absolute top-3 text-blue-200/50 hover:text-white transition-colors direction-button" data-action="prev">▲</button>
                      <button class="absolute bottom-3 text-blue-200/50 hover:text-white transition-colors direction-button" data-action="next">▼</button>
                      <button class="absolute left-3 text-blue-200/50 hover:text-white transition-colors direction-button" data-action="prev">◀</button>
                      <button class="absolute right-3 text-blue-200/50 hover:text-white transition-colors direction-button" data-action="next">▶</button>
                      
                      <!-- OK / Middle Button (Slightly cleaner rubber) -->
                      <button class="w-14 h-14 bg-blue-900 rounded-full shadow-[0_4px_0_0_#0f172a,inset_0_1px_2px_rgba(255,255,255,0.2)] text-blue-100 font-bold text-xs hover:brightness-110 active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center border border-blue-800/50"
                              data-action="pause">
                        SELECT
                      </button>
                    </div>

                    <!-- Volume & Channel Knobs (Realistic Controller Style) -->
                    <div class="flex justify-between w-full px-4">
                      <!-- Vol Knob -->
                      <div class="flex flex-col items-center gap-1">
                        <div class="w-10 h-20 bg-zinc-800 rounded-2xl flex flex-col justify-between p-1 shadow-[0_5px_0_0_#000] border border-zinc-700">
                          <button class="h-1/2 w-full text-zinc-400 text-lg font-bold hover:text-white active:bg-zinc-700 rounded-t-xl transition-colors" data-action="vol-up">+</button>
                          <div class="h-[2px] bg-zinc-900 w-full shadow-inner"></div>
                          <button class="h-1/2 w-full text-zinc-400 text-lg font-bold hover:text-white active:bg-zinc-700 rounded-b-xl transition-colors" data-action="vol-down">-</button>
                        </div>
                        <span class="text-[10px] font-black text-zinc-500 uppercase tracking-tighter mt-1">Volume</span>
                      </div>
                      
                      <!-- Ch Knob -->
                      <div class="flex flex-col items-center gap-1">
                        <div class="w-10 h-20 bg-zinc-800 rounded-2xl flex flex-col justify-between p-1 shadow-[0_5px_0_0_#000] border border-zinc-700">
                          <button class="h-1/2 w-full text-zinc-400 text-xs hover:text-white active:bg-zinc-700 rounded-t-xl" data-action="prev">▲</button>
                          <div class="h-[2px] bg-zinc-900 w-full shadow-inner"></div>
                          <button class="h-1/2 w-full text-zinc-400 text-xs hover:text-white active:bg-zinc-700 rounded-b-xl" data-action="next">▼</button>
                        </div>
                        <span class="text-[10px] font-black text-zinc-500 uppercase tracking-tighter mt-1">Channel</span>
                      </div>
                    </div>

                    <!-- Keypad -->
                    <div class="grid grid-cols-3 gap-3 bg-black/10 p-4 rounded-3xl shadow-inner border border-white/20">
                      ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="w-11 h-11 bg-zinc-800 rounded-full text-white text-sm font-bold shadow-[0_4px_0_0_#000] active:translate-y-[2px] active:shadow-none transition-all border-t border-zinc-600/30" data-num="${n}">${n}</button>`).join('')}
                      <div></div>
                      <button class="w-11 h-11 bg-zinc-800 rounded-full text-white text-sm font-bold shadow-[0_4px_0_0_#000] active:translate-y-[2px] active:shadow-none transition-all border-t border-zinc-600/30" data-num="0">0</button>
                      <div></div>
                    </div>

                    <!-- Bottom Buttons -->
                    

                  </div>
                </div>
              </div>
            </div>
        `;

        document.body.appendChild(root);
        this.rootElement = root;
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

        this.rootElement?.addEventListener('click', (e) => {
            if (!this.isVisible) {
                this.rootElement?.classList.add('active');
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
                this.rootElement?.classList.remove('active');
                this.isVisible = false;
            }
        });
    }
}

export const RemoteControl = new RemoteControlModule();
RemoteControl.init();