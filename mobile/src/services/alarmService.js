import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'hardcore-alarm-v1';
const CATEGORY_ID = 'hardcore-alarm-quiz';
const NOTIFICATION_ID = 'linguavault-daily-hardcore-alarm';
export const ALARM_NOTIFICATION_KIND = 'linguavault-hardcore-alarm';

const STORAGE_KEYS = {
  enabled: 'linguavault_auto_alarm_enabled',
  time: 'linguavault_alarm_time',
  questionCount: 'linguavault_alarm_q_count',
  active: 'linguavault_alarm_challenge_active',
  completedDate: 'linguavault_alarm_completed_date',
  notificationId: 'linguavault_alarm_notification_id'
};

const DEFAULT_CONFIG = {
  enabled: false,
  time: '20:00',
  questionCount: 3
};

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.MAX
    })
  });
}

const localDateKey = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const parseTime = (value) => {
  const match = String(value || '').trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
};

export const isValidAlarmTime = (value) => Boolean(parseTime(value));

export async function loadAlarmConfig() {
  const entries = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
  const stored = Object.fromEntries(entries);
  const questionCount = Number.parseInt(stored[STORAGE_KEYS.questionCount], 10);

  return {
    enabled: stored[STORAGE_KEYS.enabled] === 'true',
    time: parseTime(stored[STORAGE_KEYS.time]) ? stored[STORAGE_KEYS.time] : DEFAULT_CONFIG.time,
    questionCount: [3, 5, 10].includes(questionCount) ? questionCount : DEFAULT_CONFIG.questionCount,
    active: stored[STORAGE_KEYS.active] === 'true',
    completedDate: stored[STORAGE_KEYS.completedDate] || ''
  };
}

export async function saveAlarmConfig({ enabled, time, questionCount }) {
  const cleanTime = parseTime(time) ? String(time).trim() : DEFAULT_CONFIG.time;
  const cleanCount = [3, 5, 10].includes(Number(questionCount)) ? Number(questionCount) : DEFAULT_CONFIG.questionCount;
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.enabled, String(Boolean(enabled))],
    [STORAGE_KEYS.time, cleanTime],
    [STORAGE_KEYS.questionCount, String(cleanCount)]
  ]);
  return { enabled: Boolean(enabled), time: cleanTime, questionCount: cleanCount };
}

async function ensureNativeNotificationPermission() {
  if (Platform.OS === 'web') return { granted: false, reason: 'web' };

  let permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    permissions = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true }
    });
  }
  if (!permissions.granted) {
    return { granted: false, reason: 'permission-denied' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Báo thức Kỷ luật thép',
      description: 'Báo thức học tập bắt buộc mở quiz để hoàn thành.',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'alarm.wav',
      enableVibrate: true,
      vibrationPattern: [0, 500, 250, 500, 250, 900],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.ALARM,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION
      }
    });
  }

  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    {
      identifier: 'OPEN_QUIZ',
      buttonTitle: 'Mở quiz để tắt',
      options: { opensAppToForeground: true, isAuthenticationRequired: false }
    }
  ]);

  return { granted: true };
}

const buildAlarmContent = (questionCount, extraData = {}) => ({
  title: '🚨 BÁO THỨC KỶ LUẬT THÉP',
  body: `Mở LinguaVault và giải đúng ${questionCount} câu quiz để hoàn thành báo thức.`,
  data: {
    kind: ALARM_NOTIFICATION_KIND,
    questionCount: Number(questionCount) || DEFAULT_CONFIG.questionCount,
    ...extraData
  },
  sound: 'alarm.wav',
  badge: 1,
  priority: Notifications.AndroidNotificationPriority.MAX,
  color: '#ef4444',
  autoDismiss: false,
  sticky: true,
  categoryIdentifier: CATEGORY_ID,
  interruptionLevel: 'timeSensitive',
  vibrate: [0, 500, 250, 500, 250, 900]
});

export async function cancelDailyAlarm({ clearChallenge = true } = {}) {
  if (Platform.OS !== 'web') {
    try {
      const storedId = await AsyncStorage.getItem(STORAGE_KEYS.notificationId);
      await Notifications.cancelScheduledNotificationAsync(storedId || NOTIFICATION_ID);
    } catch (error) {
      console.warn('[Alarm] Could not cancel scheduled notification:', error?.message || error);
    }
  }
  const keys = clearChallenge
    ? [STORAGE_KEYS.notificationId, STORAGE_KEYS.active]
    : [STORAGE_KEYS.notificationId];
  await AsyncStorage.multiRemove(keys);
}

export async function scheduleDailyAlarm(time, questionCount) {
  const parsed = parseTime(time);
  if (!parsed) {
    throw new Error('Giờ báo thức phải có định dạng HH:mm, ví dụ 20:00.');
  }

  const permission = await ensureNativeNotificationPermission();
  if (!permission.granted) {
    return { success: false, reason: permission.reason };
  }

  await cancelDailyAlarm({ clearChallenge: false });
  const identifier = await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: buildAlarmContent(questionCount),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: parsed.hour,
      minute: parsed.minute,
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined
    }
  });

  await AsyncStorage.setItem(STORAGE_KEYS.notificationId, identifier);
  return { success: true, identifier };
}

export async function scheduleAlarmTest(seconds = 10, questionCount = DEFAULT_CONFIG.questionCount) {
  const permission = await ensureNativeNotificationPermission();
  if (!permission.granted) return { success: false, reason: permission.reason };

  const identifier = await Notifications.scheduleNotificationAsync({
    content: buildAlarmContent(questionCount, { test: true }),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(5, Number(seconds) || 10),
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined
    }
  });
  return { success: true, identifier };
}

export async function setAlarmChallengeActive(active) {
  if (active) {
    await AsyncStorage.setItem(STORAGE_KEYS.active, 'true');
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.active);
  }
}

export async function markAlarmChallengeCompleted({ recordDailyCompletion = true } = {}) {
  if (recordDailyCompletion) {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.active, 'false'],
      [STORAGE_KEYS.completedDate, localDateKey()]
    ]);
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.active);
  }
  await dismissPresentedAlarmNotifications();
  if (Platform.OS !== 'web') {
    await Notifications.setBadgeCountAsync(0).catch(() => {});
    await Notifications.clearLastNotificationResponseAsync().catch(() => {});
  }
}

export async function dismissPresentedAlarmNotifications() {
  if (Platform.OS === 'web') return;
  try {
    const presented = await Notifications.getPresentedNotificationsAsync();
    const alarmNotifications = presented.filter(
      (notification) => notification?.request?.content?.data?.kind === ALARM_NOTIFICATION_KIND
    );
    await Promise.all(
      alarmNotifications.map((notification) =>
        Notifications.dismissNotificationAsync(notification.request.identifier)
      )
    );
  } catch (error) {
    console.warn('[Alarm] Could not dismiss presented notification:', error?.message || error);
  }
}

export async function shouldRestoreAlarmChallenge(now = new Date()) {
  const config = await loadAlarmConfig();
  if (!config.enabled) return false;
  if (config.active) return true;

  const parsed = parseTime(config.time);
  if (!parsed || config.completedDate === localDateKey(now)) return false;
  const alarmMinute = parsed.hour * 60 + parsed.minute;
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  return currentMinute >= alarmMinute;
}

export function isAlarmNotification(responseOrNotification) {
  const data = responseOrNotification?.notification?.request?.content?.data
    || responseOrNotification?.request?.content?.data;
  return data?.kind === ALARM_NOTIFICATION_KIND;
}

export function addAlarmNotificationListeners({ onReceive, onResponse }) {
  if (Platform.OS === 'web') return () => {};
  const received = Notifications.addNotificationReceivedListener((notification) => {
    if (isAlarmNotification(notification)) onReceive?.(notification);
  });
  const responded = Notifications.addNotificationResponseReceivedListener((response) => {
    if (isAlarmNotification(response)) onResponse?.(response);
  });
  return () => {
    received.remove();
    responded.remove();
  };
}

export async function getInitialAlarmNotificationResponse() {
  if (Platform.OS === 'web') return null;
  const response = await Notifications.getLastNotificationResponseAsync();
  return isAlarmNotification(response) ? response : null;
}
