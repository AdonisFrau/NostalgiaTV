interface ProgramData {
    id: number;
    name: string;
    video: string;
    vibe: string;
    channel?: string;
}

export const channels: ProgramData[] = [
    {
        id: 1,
        name: "Midnight Anime",
        video: "/videos/anime-night.mp4",
        vibe: "rain",
        channel: "StudyVibe"
    },
    {
        id: 2,
        name: "Commercial Break",
        video: "/videos/ads.mp4",
        vibe: "ads",
        channel: "Nostalgia-Center"
    }
];

class Program {
    id: number;
    name: string;
    video: string;
    vibe: string;
    channel: string | null;

    constructor(id: number, name: string, video: string, vibe: string, channel: string | null = null) {
        this.id = id;
        this.name = name;
        this.video = video;
        this.vibe = vibe;
        this.channel = channel;
    }
}

class Channel {
    cycles: Program[];
    currentRunningProgram: number;

    constructor(listOfPrograms: ProgramData[] = []) {
        if (!Array.isArray(listOfPrograms)) {
            throw new Error("listOfPrograms must be an array");
        }
        this.cycles = listOfPrograms.map(p => new Program(p.id, p.name, p.video, p.vibe, p.channel || null));
        this.currentRunningProgram = this.cycles.length > 0 ? Math.floor(Math.random() * this.cycles.length) : 0;
    }

    getRandomProgram(): Program | null {
        if (this.cycles.length === 0) {
            throw new Error("No programs available in this channel");
        }
        if (this.cycles.length === 1) {
            return this.cycles[0];
        }
        let random: number;
        do {
            random = Math.floor(Math.random() * this.cycles.length);
        } while (random === this.currentRunningProgram);
        this.currentRunningProgram = random;
        return this.cycles[random];
    }

    addProgram(program: Program): void {
        if (!(program instanceof Program)) {
            throw new Error("Program must be an instance of Program class");
        }
        this.cycles.push(program);
    }

    removeProgram(id: number): void {
        const index = this.cycles.findIndex(p => p.id === id);
        if (index !== -1) {
            this.cycles.splice(index, 1);
            if (this.currentRunningProgram >= this.cycles.length) {
                this.currentRunningProgram = 0;
            }
        }
    }

    getCurrentProgram(): Program | null {
        return this.cycles[this.currentRunningProgram] || null;
    }
}

interface ChannelData {
    programs?: ProgramData[];
}

export class ChannelManager {
    channelList: Channel[];
    currentChannelOn: number;

    constructor(listOfChannels: ChannelData[] = []) {
        if (!Array.isArray(listOfChannels)) {
            throw new Error("listOfChannels must be an array");
        }
        this.channelList = listOfChannels.map(c => new Channel(c.programs || []));
        if (this.channelList.length === 0) {
            throw new Error("At least one channel must be provided");
        }
        this.currentChannelOn = 0;
    }

    switchChannel(): void {
        this.currentChannelOn = (this.currentChannelOn + 1) % this.channelList.length;
    }

    getCurrentChannel(): Channel {
        return this.channelList[this.currentChannelOn];
    }

    getCurrentProgram(): Program | null {
        const channel = this.getCurrentChannel();
        return channel ? channel.getCurrentProgram() : null;
    }

    addChannel(channel: Channel): void {
        if (!(channel instanceof Channel)) {
            throw new Error("Channel must be an instance of Channel class");
        }
        this.channelList.push(channel);
    }

    removeChannel(index: number): void {
        if (index < 0 || index >= this.channelList.length) {
            throw new Error("Invalid channel index");
        }
        this.channelList.splice(index, 1);
        if (this.currentChannelOn >= this.channelList.length) {
            this.currentChannelOn = 0;
        }
    }

    playRandomProgram(): Program | null {
        const channel = this.getCurrentChannel();
        return channel ? channel.getRandomProgram() : null;
    }
}