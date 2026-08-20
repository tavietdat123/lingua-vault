import { spawn, exec } from 'node:child_process';
import os from 'node:os';

class SystemAlarmService {
  constructor() {
    this.isPlaying = false;
    this.loopInterval = null;
    this.activeProcesses = [];
    this.lastTriggerDate = '';
  }

  // Start continuous loud native system alarm
  startAlarm() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    console.log('🚨 [SystemAlarm] Starting continuous OS-level alarm ringing...');

    // 1. Send native desktop notification & bring app to focus
    this.showSystemNotification(
      '🚨 BÁO THỨC KỶ LUẬT THÉP ĐANG REO!',
      'Bắt buộc hoàn thành bài tập Quiz để tắt chuông!'
    );

    // 2. Continuous audio loop
    const playNativeSound = () => {
      if (!this.isPlaying) return;

      if (os.platform() === 'darwin') {
        // Play macOS alert sound (Morse or Sosumi or Ping)
        try {
          const p1 = spawn('afplay', ['/System/Library/Sounds/Morse.aiff']);
          this.activeProcesses.push(p1);
          p1.on('close', () => {
            this.activeProcesses = this.activeProcesses.filter(p => p !== p1);
          });
        } catch (e) {
          try {
            const p2 = spawn('afplay', ['/System/Library/Sounds/Ping.aiff']);
            this.activeProcesses.push(p2);
          } catch (err) {}
        }
      } else if (os.platform() === 'win32') {
        // Windows bell sound
        try {
          exec('powershell -c "[console]::beep(1000, 400)"');
        } catch (e) {}
      } else {
        // Linux / other
        try {
          exec('paplay /usr/share/sounds/freedesktop/stereo/alarm-clock-elapsed.oga || beep');
        } catch (e) {}
      }
    };

    playNativeSound();
    this.loopInterval = setInterval(playNativeSound, 1200);
  }

  // Stop the alarm (Called ONLY when the user completes the quiz)
  stopAlarm() {
    this.isPlaying = false;
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    // Kill any active sound sub-processes
    this.activeProcesses.forEach(p => {
      try {
        p.kill();
      } catch (e) {}
    });
    this.activeProcesses = [];
    console.log('✅ [SystemAlarm] Alarm silenced successfully after quiz completion.');

    // Play quick celebratory fanfare sound on macOS
    if (os.platform() === 'darwin') {
      try {
        spawn('afplay', ['/System/Library/Sounds/Hero.aiff']);
      } catch (e) {}
    }
  }

  showSystemNotification(title, message) {
    if (os.platform() === 'darwin') {
      const script = `display notification "${message}" with title "${title}" sound name "Morse"`;
      exec(`osascript -e '${script}'`, (err) => {
        if (err) console.warn('[SystemAlarm] Notification error:', err.message);
      });
    }
  }

  getStatus() {
    return {
      isPlaying: this.isPlaying,
      lastTriggerDate: this.lastTriggerDate
    };
  }
}

export const systemAlarmService = new SystemAlarmService();
