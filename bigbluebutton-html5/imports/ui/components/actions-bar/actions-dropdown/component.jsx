import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, intlShape } from 'react-intl';
import Button from '/imports/ui/components/button/component';
import Dropdown from '/imports/ui/components/dropdown/component';
import DropdownTrigger from '/imports/ui/components/dropdown/trigger/component';
import DropdownContent from '/imports/ui/components/dropdown/content/component';
import DropdownList from '/imports/ui/components/dropdown/list/component';
import DropdownListItem from '/imports/ui/components/dropdown/list/item/component';
import PresentationUploaderContainer from '/imports/ui/components/presentation/presentation-uploader/container';
import { withModalMounter } from '/imports/ui/components/modal/service';
import getFromUserSettings from '/imports/ui/services/users-settings';
import withShortcutHelper from '/imports/ui/components/shortcut-help/service';
import BreakoutRoom from '../create-breakout-room/component';
import { styles } from '../styles';
import ActionBarService from '../service';

const propTypes = {
  isUserPresenter: PropTypes.bool.isRequired,
  intl: intlShape.isRequired,
  mountModal: PropTypes.func.isRequired,
  isUserModerator: PropTypes.bool.isRequired,
  allowStartStopRecording: PropTypes.bool.isRequired,
  isRecording: PropTypes.bool.isRequired,
  record: PropTypes.func.isRequired,
  toggleRecording: PropTypes.func.isRequired,
  meetingIsBreakout: PropTypes.bool.isRequired,
  hasBreakoutRoom: PropTypes.bool.isRequired,
  createBreakoutRoom: PropTypes.func.isRequired,
  meetingName: PropTypes.string.isRequired,
  shortcuts: PropTypes.string.isRequired,
  users: PropTypes.arrayOf(PropTypes.object).isRequired,
};

const intlMessages = defineMessages({
  actionsLabel: {
    id: 'app.actionsBar.actionsDropdown.actionsLabel',
    description: 'Actions button label',
  },
  presentationLabel: {
    id: 'app.actionsBar.actionsDropdown.presentationLabel',
    description: 'Upload a presentation option label',
  },
  presentationDesc: {
    id: 'app.actionsBar.actionsDropdown.presentationDesc',
    description: 'adds context to upload presentation option',
  },
  desktopShareLabel: {
    id: 'app.actionsBar.actionsDropdown.desktopShareLabel',
    description: 'Desktop Share option label',
  },
  stopDesktopShareLabel: {
    id: 'app.actionsBar.actionsDropdown.stopDesktopShareLabel',
    description: 'Stop Desktop Share option label',
  },
  desktopShareDesc: {
    id: 'app.actionsBar.actionsDropdown.desktopShareDesc',
    description: 'adds context to desktop share option',
  },
  stopDesktopShareDesc: {
    id: 'app.actionsBar.actionsDropdown.stopDesktopShareDesc',
    description: 'adds context to stop desktop share option',
  },
  startRecording: {
    id: 'app.actionsBar.actionsDropdown.startRecording',
    description: 'start recording option',
  },
  stopRecording: {
    id: 'app.actionsBar.actionsDropdown.stopRecording',
    description: 'stop recording option',
  },
  pollBtnLabel: {
    id: 'app.actionsBar.actionsDropdown.pollBtnLabel',
    description: 'poll menu toggle button label',
  },
  pollBtnDesc: {
    id: 'app.actionsBar.actionsDropdown.pollBtnDesc',
    description: 'poll menu toggle button description',
  },
  createBreakoutRoom: {
    id: 'app.actionsBar.actionsDropdown.createBreakoutRoom',
    description: 'Create breakout room option',
  },
  createBreakoutRoomDesc: {
    id: 'app.actionsBar.actionsDropdown.createBreakoutRoomDesc',
    description: 'Description of create breakout room option',
  },
});

class ActionsDropdown extends Component {
  constructor(props) {
    super(props);
    this.handlePresentationClick = this.handlePresentationClick.bind(this);
    this.handleCreateBreakoutRoomClick = this.handleCreateBreakoutRoomClick.bind(this);
  }

  componentWillMount() {
    this.presentationItemId = _.uniqueId('action-item-');
    this.recordId = _.uniqueId('action-item-');
    this.pollId = _.uniqueId('action-item-');
    this.createBreakoutRoomId = _.uniqueId('action-item-');
  }

  componentDidMount() {
    if (Meteor.settings.public.allowOutsideCommands.toggleRecording
      || getFromUserSettings('outsideToggleRecording', false)) {
      ActionBarService.connectRecordingObserver();
      window.addEventListener('message', ActionBarService.processOutsideToggleRecording);
    }
  }

  componentWillUpdate(nextProps) {
    const { isUserPresenter: isPresenter } = nextProps;
    const { isUserPresenter: wasPresenter, mountModal } = this.props;
    if (wasPresenter && !isPresenter) {
      mountModal(null);
    }
  }

  getAvailableActions() {
    const {
      intl,
      isUserPresenter,
      isUserModerator,
      allowStartStopRecording,
      isRecording,
      record,
      toggleRecording,
      meetingIsBreakout,
      hasBreakoutRoom,
    } = this.props;

    const {
      pollBtnLabel,
      pollBtnDesc,
      presentationLabel,
      presentationDesc,
      startRecording,
      stopRecording,
      createBreakoutRoom,
      createBreakoutRoomDesc,
    } = intlMessages;

    const {
      formatMessage,
    } = intl;

    return _.compact([
      (isUserPresenter
        ? (
          <DropdownListItem
            icon="user"
            label={formatMessage(pollBtnLabel)}
            description={formatMessage(pollBtnDesc)}
            key={this.pollId}
            onClick={() => {
              Session.set('openPanel', 'poll');
              Session.set('forcePollOpen', true);
            }}
          />
        )
        : null),
      (isUserPresenter
        ? (
          <DropdownListItem
            data-test="uploadPresentation"
            icon="presentation"
            label={formatMessage(presentationLabel)}
            description={formatMessage(presentationDesc)}
            key={this.presentationItemId}
            onClick={this.handlePresentationClick}
          />
        )
        : null),
      (record && isUserModerator && allowStartStopRecording
        ? (
          <DropdownListItem
            icon="record"
            label={formatMessage(isRecording
              ? stopRecording : startRecording)}
            description={formatMessage(isRecording
              ? stopRecording : startRecording)}
            key={this.recordId}
            onClick={toggleRecording}
          />
        )
        : null),
      (isUserModerator && !meetingIsBreakout && !hasBreakoutRoom
        ? (
          <DropdownListItem
            icon="rooms"
            label={formatMessage(createBreakoutRoom)}
            description={formatMessage(createBreakoutRoomDesc)}
            key={this.createBreakoutRoomId}
            onClick={this.handleCreateBreakoutRoomClick}
          />
        )
        : null),
    ]);
  }

  handlePresentationClick() {
    const { mountModal } = this.props;
    mountModal(<PresentationUploaderContainer />);
  }

  handleCreateBreakoutRoomClick() {
    const {
      createBreakoutRoom,
      mountModal,
      meetingName,
      users,
    } = this.props;

    mountModal(
      <BreakoutRoom
        createBreakoutRoom={createBreakoutRoom}
        meetingName={meetingName}
        users={users}
      />,
    );
  }

  render() {
    const {
      intl,
      isUserPresenter,
      isUserModerator,
      shortcuts: OPEN_ACTIONS_AK,
    } = this.props;

    const availableActions = this.getAvailableActions();

    if ((!isUserPresenter && !isUserModerator) || availableActions.length === 0) return null;

    return (
      <Dropdown ref={(ref) => { this._dropdown = ref; }}>
        <DropdownTrigger tabIndex={0} accessKey={OPEN_ACTIONS_AK}>
          <Button
            hideLabel
            aria-label={intl.formatMessage(intlMessages.actionsLabel)}
            className={styles.button}
            label={intl.formatMessage(intlMessages.actionsLabel)}
            icon="plus"
            color="primary"
            size="lg"
            circle
            onClick={() => null}
          />
        </DropdownTrigger>
        <DropdownContent placement="top left">
          <DropdownList>
            {availableActions}
          </DropdownList>
        </DropdownContent>
      </Dropdown>
    );
  }
}

ActionsDropdown.propTypes = propTypes;

export default withShortcutHelper(withModalMounter(injectIntl(ActionsDropdown)), 'openActions');
