/**
 * Drop-in Alert replacement that works on web.
 * On native: delegates to RN Alert.alert (unchanged behaviour).
 * On web:    uses ConfirmModal via confirmStore (themed, non-blocking).
 *
 * Usage — same as Alert.alert:
 *   import { Alert } from '@/utils/alert';
 *   Alert.alert('Title', 'Message');
 *   Alert.alert('Confirm?', 'Are you sure?', [
 *     { text: 'Cancel', style: 'cancel' },
 *     { text: 'Delete', style: 'destructive', onPress: () => doIt() },
 *   ]);
 */

import { Alert as RNAlert, Platform } from 'react-native';
import { useConfirmStore } from '@/stores/confirmStore';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

function webAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  const store = useConfirmStore.getState();
  const msg = message ?? '';

  if (!buttons || buttons.length === 0) {
    // No buttons → single OK dismiss
    store.show({ title, message: msg, confirmText: 'OK' }).then(() => {});
    return;
  }

  const cancelBtn  = buttons.find(b => b.style === 'cancel');
  const actionBtns = buttons.filter(b => b.style !== 'cancel');
  const primary    = actionBtns[0];

  if (!cancelBtn) {
    // Single button (no cancel)
    store.show({ title, message: msg, confirmText: primary?.text ?? 'OK' })
      .then(() => { primary?.onPress?.(); });
    return;
  }

  // Two-button confirm / cancel
  store.show({
    title,
    message: msg,
    confirmText: primary?.text ?? 'OK',
    cancelText:  cancelBtn.text,
  }).then(confirmed => {
    if (confirmed) primary?.onPress?.();
    else           cancelBtn.onPress?.();
  });
}

export const Alert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    _options?: any,
  ): void => {
    if (Platform.OS !== 'web') {
      RNAlert.alert(title, message ?? '', buttons as any, _options);
    } else {
      webAlert(title, message, buttons);
    }
  },
};
