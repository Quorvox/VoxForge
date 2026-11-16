// @flow
import * as React from 'react';
import Dialog from '../../UI/Dialog';
import FlatButton from '../../UI/FlatButton';
import useAlertDialog from '../../UI/Alert/useAlertDialog';
import Window from '../../Utils/Window';
import classes from './QuorvoxProfileChip.module.css';
import {
  useQuorvoxAuth,
  startQuorvoxLogin,
  signOutFromQuorvox,
  checkLoginAvailability,
  clearQuorvoxLoginError,
  type QuorvoxUser,
} from './QuorvoxAuth';
import { vf, useVfLanguage } from '../../Utils/i18n/vfStrings';

const ID_SITE = 'https://id.quorvox.ru';

const getInitial = (user: QuorvoxUser): string =>
  ((user.name || user.quorvox_id || user.email || '?').trim()[0] || '?').toUpperCase();

const Avatar = ({ user, large }: {| user: QuorvoxUser, large?: boolean |}) => (
  <span className={large ? classes.avatarLarge : classes.avatar}>
    {getInitial(user)}
  </span>
);

const ProfileDialog = ({
  user,
  onClose,
}: {|
  user: QuorvoxUser,
  onClose: () => void,
|}) => {
  const [copied, setCopied] = React.useState(false);

  const copyId = async () => {
    if (!user.quorvox_id) return;
    try {
      await navigator.clipboard.writeText(user.quorvox_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      // Буфер обмена недоступен — номер можно выделить и скопировать вручную.
    }
  };

  return (
    <Dialog
      open
      title={vf('Профиль')}
      maxWidth="xs"
      onRequestClose={onClose}
      actions={[<FlatButton key="close" label={vf('Закрыть')} onClick={onClose} />]}
      secondaryActions={[
        <FlatButton
          key="signout"
          label={vf('Выйти')}
          onClick={async () => {
            await signOutFromQuorvox();
            onClose();
          }}
        />,
      ]}
    >
      <div className={classes.profile}>
        <Avatar user={user} large />
        <div className={classes.name}>{user.name || vf('Без имени')}</div>
        <div className={classes.badge}>Quorvox ID</div>

        {user.quorvox_id && (
          <div className={classes.row}>
            <span className={classes.rowLabel}>{vf('Номер аккаунта')}</span>
            <span className={classes.rowValue}>
              <span className={classes.mono}>{user.quorvox_id}</span>
              <button type="button" className={classes.copy} onClick={copyId}>
                {copied ? vf('Скопировано') : vf('Копировать')}
              </button>
            </span>
          </div>
        )}
        {user.email && (
          <div className={classes.row}>
            <span className={classes.rowLabel}>{vf('Почта')}</span>
            <span className={classes.rowValue}>
              {user.email}
              <span
                className={
                  user.email_verified ? classes.verified : classes.unverified
                }
              >
                {user.email_verified ? vf('подтверждена') : vf('не подтверждена')}
              </span>
            </span>
          </div>
        )}

        <FlatButton
          label={vf('Управление аккаунтом')}
          onClick={() => Window.openExternalURL(ID_SITE)}
        />
      </div>
    </Dialog>
  );
};

/**
 * VoxForge: профиль в верхней панели. Не вошёл — кнопка «Войти»; вошёл —
 * аватар с именем, по клику открывается карточка профиля.
 */
const QuorvoxProfileChip = (): React.Node => {
  useVfLanguage();
  const { status, user, loginError } = useQuorvoxAuth();
  const { showAlert } = useAlertDialog();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  // Ошибка входа показывается один раз и сбрасывается.
  React.useEffect(
    () => {
      if (!loginError) return;
      showAlert({
        title: vf('Не удалось войти'),
        message: loginError,
      });
      clearQuorvoxLoginError();
    },
    [loginError, showAlert]
  );

  const onLoginClick = async () => {
    const availability = await checkLoginAvailability();
    if (availability === 'ready') {
      startQuorvoxLogin();
    } else if (availability === 'not-configured') {
      showAlert({
        title: vf('Вход ещё настраивается'),
        message: vf(
          'Сервис входа запущен, но проект ещё не подключён к Quorvox ID. Попробуй позже.'
        ),
      });
    } else {
      showAlert({
        title: vf('Сервис входа недоступен'),
        message: vf('Не получилось связаться с сервисом входа. Попробуй позже.'),
      });
    }
  };

  if (status === 'loading') return <span className={classes.skeleton} />;

  if (status === 'signed-in' && user) {
    return (
      <>
        <button
          type="button"
          className={classes.chip}
          onClick={() => setIsProfileOpen(true)}
          title={vf('Профиль')}
        >
          <Avatar user={user} />
          <span className={classes.chipName}>{user.name || user.quorvox_id}</span>
        </button>
        {isProfileOpen && (
          <ProfileDialog user={user} onClose={() => setIsProfileOpen(false)} />
        )}
      </>
    );
  }

  return (
    <button type="button" className={classes.login} onClick={onLoginClick}>
      <span className={classes.idMark}>ID</span>
      {vf('Войти')}
    </button>
  );
};

export default QuorvoxProfileChip;
