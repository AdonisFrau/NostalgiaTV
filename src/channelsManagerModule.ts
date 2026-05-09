interface ProgramData {
    id: number;
    name: string;
    video: string;
    vibe: string;
    channel: string;
}

declare global {
    interface Window {
        switchChannelFeed?: (channelKey: string, programId?: number) => void;
        getCurrentChannelState?: () => {
            channelKey: string;
            channelLabel: string;
            program: ProgramData | null;
            videoSrc: string;
            durationMs: number;
            currentTime: Date;
        };
    }
}

interface ChannelSource {
    key: string;
    label: string;
    file: string;
    durationMs: number;
    programs: ProgramData[];
}

class ChannelsManagerModule {
    private rootElement: HTMLElement | null = null;
    private channels: ChannelSource[] = [
        {
            key: 'programs',
            label: '2000s Network',
            file: '/programs.json',
            durationMs: 5 * 60 * 1000,
            programs: []
        },
        {
            key: 'study',
            label: 'Study-Central Academia',
            file: '/StudyCentralPrograms.json',
            durationMs: 30 * 60 * 1000,
            programs: []
        },
        {
            key: 'christmas',
            label: 'Christmas-Carols24',
            file: '/ChristmalesCarols24.json',
            durationMs: 30 * 60 * 1000,
            programs: []
        }
    ];
    private activeChannelKey: string = 'programs';
    private loadPromise: Promise<void> | null = null;

    public init(): void {
        if (this.rootElement) return;
        this.createOverlay();
        this.loadPromise = this.loadAllChannels();
    }

    public async show(): Promise<void> {
        if (!this.rootElement) {
            this.init();
        }

        if (this.loadPromise) {
            await this.loadPromise;
        }

        this.syncCurrentState();
        this.renderChannels();
        this.rootElement!.style.display = 'flex';
    }

    public hide(): void {
        if (!this.rootElement) return;
        this.rootElement.style.display = 'none';
    }

    private createOverlay(): void {
        const overlay = document.createElement('div');
        overlay.id = 'channel-manager-root';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0, 0, 0, 0.95)';
        overlay.style.zIndex = '10000';
        overlay.style.display = 'none';
        overlay.style.alignItems = 'stretch';
        overlay.style.justifyContent = 'stretch';
        overlay.style.overflow = 'hidden';
        overlay.style.padding = '0';

        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.background = '#13406b';
        container.style.borderRadius = '0';
        container.style.overflow = 'hidden';
        container.style.boxShadow = 'none';

        container.innerHTML = `
            <style>
              #channel-manager-root * { box-sizing: border-box; }
              #manager-body { font-family: 'Arial', sans-serif; color: #fff; }
              .top-bar { background: linear-gradient(180deg, #b8d4f0 0%, #7ab0d8 40%, #4a8fc0 100%); display: flex; align-items: stretch; height: 160px; position: relative; }
              .logo-area { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 14px 20px; min-width: 150px; border-right: 1px solid rgba(255,255,255,0.3); }
              .dlogo { width: 64px; height: 64px; position: relative; margin-bottom: 6px; }
              .dlogo svg { width: 100%; height: 100%; }
              .logo-text { font-size: 13px; font-weight: bold; color: #003366; letter-spacing: 1px; text-align: center; }
              .header-center { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 0 28px; }
              .channel-title { font-size: 26px; font-weight: bold; color: #001e3c; margin-bottom: 8px; letter-spacing: 0.5px; }
              .time-bar { display: flex; align-items: center; gap: 36px; flex-wrap: wrap; }
              .time-info, .time-range { background: rgba(0,40,100,0.55); color: #fff; font-size: 16px; font-weight: bold; padding: 6px 16px; border-radius: 4px; letter-spacing: 0.5px; min-width: 120px; text-align: center; }
              .rating-badge { margin-left: auto; background: rgba(0,40,100,0.45); color: #fff; font-size: 15px; font-weight: bold; padding: 6px 16px; border-radius: 4px; }
              .video-preview { width: 340px; min-width: 340px; height: 150px; background: #000; border-left: 4px solid #5090c0; overflow: hidden; position: relative; }
              .video-preview iframe { width: 100%; height: 100%; border: none; pointer-events: none; }
              .guide-watermark { position: absolute; top: 6px; right: 14px; font-size: 36px; font-style: italic; font-weight: 300; color: rgba(255,255,255,0.55); font-family: Georgia, serif; letter-spacing: 2px; pointer-events: none; text-shadow: 1px 1px 4px rgba(0,0,0,0.4); z-index: 10; }
              .signal-msg { background: #2060a8; border-bottom: 2px solid #1a4a7a; padding: 10px 18px; font-size: 14px; font-weight: bold; color: #fff; line-height: 1.5; }
              .grid-header { background: #1a3d6b; display: flex; align-items: center; height: 40px; border-bottom: 1px solid #2a5d9b; }
              .grid-header .date-cell { width: 150px; min-width: 150px; font-size: 15px; font-weight: bold; color: #fff; padding: 0 12px; border-right: 1px solid #2a5d9b; height: 100%; display: flex; align-items: center; }
              .grid-header .time-slots { flex: 1; display: flex; height: 100%; position: relative; }
              .time-slot-label { flex: 1; font-size: 14px; font-weight: bold; color: #fff; display: flex; align-items: center; padding-left: 10px; border-right: 1px solid #2a5d9b; }
              .channel-grid { background: #1e4d82; }
              .channel-row { display: flex; align-items: center; height: 50px; border-bottom: 1px solid #2a5d9b; transition: background 0.1s; cursor: pointer; }
              .channel-row:hover { background: rgba(255,255,255,0.08); }
              .channel-row.selected { background: rgba(255,200,0,0.16); }
              .ch-num-name { width: 150px; min-width: 150px; font-size: 15px; font-weight: bold; color: #fff; padding: 0 12px; border-right: 1px solid #2a5d9b; height: 100%; display: flex; align-items: center; }
              .ch-programs { flex: 1; display: flex; align-items: center; height: 100%; position: relative; overflow: hidden; }
              .prog-block { height: 32px; display: flex; align-items: center; padding: 0 10px; font-size: 13px; font-weight: bold; color: #fff; border-right: 1px solid rgba(0,0,0,0.3); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; cursor: pointer; border-radius: 3px; margin: 0 1px; transition: filter 0.15s; }
              .prog-block:hover { filter: brightness(1.18); }
              .prog-block.selected-prog { background: #f0a800 !important; color: #000; }
              .prog-block.blue-dark { background: #1a4a8a; }
              .prog-block.blue-mid { background: #2060aa; }
              .prog-block.empty { background: transparent; color: transparent; flex: 1; }
              .arrow-left, .arrow-right { font-size: 14px; color: #aaccee; padding: 0 8px; flex-shrink: 0; }
              .footer-bar { background: #1560ab; display: flex; align-items: center; height: 44px; padding: 0 16px; gap: 20px; border-top: 2px solid #0a3d7a; }
              .footer-label { font-size: 15px; font-weight: bold; color: #fff; margin-right: 8px; }
              .legend-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #fff; }
              .legend-dot { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; }
              .dot-red { background: #e03030; }
              .dot-green { background: #30c030; }
              .dot-yellow { background: #f0c000; }
              .close-guide { position: absolute; top: 18px; right: 18px; width: 36px; height: 36px; border-radius: 50%; background: rgba(0,0,0,0.35); color: #fff; border: 1px solid rgba(255,255,255,0.35); display: flex; align-items: center; justify-content: center; cursor: pointer; font-weight: bold; }
            </style>
            <div id="manager-body">
              <div class="top-bar">
                <div class="logo-area">
                  <div class="dlogo">
                    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color:#ffffff"/>
                          <stop offset="100%" style="stop-color:#aaccee"/>
                        </linearGradient>
                      </defs>
                      <path d="M12 48 Q8 30 20 16 Q32 4 50 8" stroke="url(#dg)" stroke-width="5" fill="none" stroke-linecap="round"/>
                      <path d="M18 48 Q15 32 25 21 Q36 10 50 14" stroke="url(#dg)" stroke-width="4" fill="none" stroke-linecap="round"/>
                      <path d="M24 47 Q22 34 30 25 Q39 17 50 20" stroke="url(#dg)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
                      <circle cx="14" cy="50" r="4" fill="url(#dg)"/>
                    </svg>
                  </div>
                  <div class="logo-text">Nostalgia Central TV</div>
                </div>
                <div class="header-center">
                  <div class="channel-title" id="managerChannelTitle">Nostalgia TV CHOICE (2009)</div>
                  <div class="time-bar">
                    <div class="time-info" id="managerCurrentTime">Mon 5:46a</div>
                    <div class="time-range" id="managerTimeRange">5:30a – 6:00a</div>
                    <div class="rating-badge" id="managerRating">TV-PG</div>
                  </div>
                </div>
                <div class="video-preview">
                  <div class="guide-watermark">guide</div>
                  <iframe id="managerPlayer" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                </div>
                <div class="close-guide" id="managerCloseBtn">×</div>
              </div>
              <div class="signal-msg">Use the remote SELECT button to open the schedule, then click any upcoming block to switch the broadcast channel.</div>
              <div class="grid-header">
                <div class="date-cell" id="managerGridDate">Mon 9/13</div>
                <div class="time-slots">
                  <div class="time-slot-label">Now</div>
                  <div class="time-slot-label">Next</div>
                  <div class="time-slot-label">Following</div>
                </div>
              </div>
              <div class="channel-grid" id="managerChannelGrid"></div>
              <div class="footer-bar">
                <span class="footer-label">Channels I Get</span>
                <span style="flex:1"></span>
                <span class="legend-item"><span class="legend-dot dot-red"></span> Current</span>
                <span class="legend-item"><span class="legend-dot dot-green"></span> Up next</span>
                <span class="legend-item"><span class="legend-dot dot-yellow"></span> Switch</span>
              </div>
            </div>
        `;

        overlay.appendChild(container);
        document.body.appendChild(overlay);
        this.rootElement = overlay;

        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                this.hide();
            }
        });

        const closeBtn = overlay.querySelector('#managerCloseBtn');
        closeBtn?.addEventListener('click', () => this.hide());

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.hide();
        });
    }

    private async loadAllChannels(): Promise<void> {
        await Promise.all(this.channels.map(async (channel) => {
            try {
                const response = await fetch(channel.file);
                if (!response.ok) {
                    throw new Error(`Failed to load ${channel.file}`);
                }
                channel.programs = await response.json();
            } catch (error) {
                console.error(error);
                channel.programs = [];
            }
        }));
    }

    private syncCurrentState(): void {
        const state = window.getCurrentChannelState ? window.getCurrentChannelState() : null;
        if (state) {
            this.activeChannelKey = state.channelKey;
            this.updateHeader(state);
        }
    }

    private updateHeader(state: { channelLabel: string; program: ProgramData | null; videoSrc: string; durationMs: number; currentTime: Date; }): void {
        const titleEl = this.rootElement!.querySelector('#managerChannelTitle');
        const timeEl = this.rootElement!.querySelector('#managerCurrentTime');
        const rangeEl = this.rootElement!.querySelector('#managerTimeRange');
        const dateEl = this.rootElement!.querySelector('#managerGridDate');
        const player = this.rootElement!.querySelector('#managerPlayer') as HTMLIFrameElement | null;

        if (titleEl) {
            titleEl.textContent = `${state.channelLabel} — ${state.program ? state.program.name : 'Broadcast'}`;
        }

        if (timeEl) {
            const now = state.currentTime;
            const hours = now.getHours() % 12 || 12;
            const mins = now.getMinutes().toString().padStart(2, '0');
            const ampm = now.getHours() >= 12 ? 'p' : 'a';
            timeEl.textContent = `${hours}:${mins}${ampm}`;
        }

        if (rangeEl) {
            const start = state.currentTime;
            const end = new Date(start.getTime() + state.durationMs);
            const format = (date: Date) => {
                const hrs = date.getHours() % 12 || 12;
                const mins = date.getMinutes().toString().padStart(2, '0');
                const ap = date.getHours() >= 12 ? 'p' : 'a';
                return `${hrs}:${mins}${ap}`;
            };
            rangeEl.textContent = `${format(start)} – ${format(end)}`;
        }

        if (dateEl) {
            const now = state.currentTime;
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dateEl.textContent = `${days[now.getDay()]} ${now.getMonth() + 1}/${now.getDate()}`;
        }

        if (player) {
            player.src = state.videoSrc;
        }
    }

    private renderChannels(): void {
        if (!this.rootElement) return;
        const grid = this.rootElement.querySelector('#managerChannelGrid');
        if (!grid) return;

        grid.innerHTML = this.channels.map((channel) => {
            const schedule = this.getSchedule(channel);
            const programBlocks = schedule.map((program, index) => {
                const isCurrent = channel.key === this.activeChannelKey && index === 0;
                const className = isCurrent ? 'prog-block selected-prog' : index === 0 ? 'prog-block blue-dark' : 'prog-block blue-mid';
                return `<span class="${className}" data-channel="${channel.key}" data-id="${program.id}">${program.name}</span>`;
            }).join('');

            return `
                <div class="channel-row ${channel.key === this.activeChannelKey ? 'selected' : ''}">
                    <div class="ch-num-name">${channel.label}</div>
                    <div class="ch-programs">
                        ${programBlocks}
                    </div>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.prog-block').forEach((block) => {
            block.addEventListener('click', (event) => {
                const target = event.currentTarget as HTMLElement;
                const channelKey = target.dataset.channel;
                const programId = target.dataset.id ? Number(target.dataset.id) : undefined;
                if (!channelKey || !programId) return;
                if (window.switchChannelFeed) {
                    window.switchChannelFeed(channelKey, programId);
                }
                this.hide();
            });
        });
    }

    private getSchedule(channel: ChannelSource): ProgramData[] {
        if (!channel.programs.length) return [];
        const count = Math.min(3, channel.programs.length);
        const seed = this.seedForChannel(channel.key);
        const startIndex = Math.floor(seed * channel.programs.length);
        const schedule: ProgramData[] = [];
        for (let i = 0; i < count; i += 1) {
            schedule.push(channel.programs[(startIndex + i) % channel.programs.length]);
        }
        return schedule;
    }

    private seedForChannel(key: string): number {
        const now = new Date();
        const daySeed = Math.floor(now.getTime() / 86400000);
        let hash = 0;
        for (let i = 0; i < key.length; i += 1) {
            hash = (hash * 31 + key.charCodeAt(i)) % 1000;
        }
        return ((hash + daySeed) % 1000) / 1000;
    }
}

export const ChannelsManager = new ChannelsManagerModule();
