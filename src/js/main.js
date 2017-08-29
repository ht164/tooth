import React from 'react';
import ReactDOM from 'react-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { createStore, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';
import Mastodon from 'mstdn-api';

const host = 'HOSTNAME';
const access_token = 'ACCESS_TOKEN';

/**
 * state
 *
 * {
 *    toots: [ { toot }, { toot }, ... ],
 *    notifies: [ { notify }, { notify }, ... ],
 *    config: { ... },
 * }
 */
const initialConfigState = {
  color_theme: 'dark',
};

/**
 * action
 */
const ACT_ADD = "add";
const ACT_UPDATE = "update";
const ACT_DELETE = "delete";
const ACT_BT = "bt";
const ACT_UNBT = "unbt";
const ACT_FAV = "fav";
const ACT_UNFAV = "unfav";
const ACT_NOTIFY = "notify";
const ACT_ADD_NOTIFIES = "add_notifies";
const ACT_UPDATE_CONFIG = "update_config";

function act_add(toots) {
  return {
    type: ACT_ADD,
    toots: toots
  };
}
function act_update(toot) {
  return {
    type: ACT_UPDATE,
    toot: toot,
  };
}
function act_delete(id) {
  return {
    type: ACT_DELETE,
    id: id,
  };
}
function act_bt(id) {
  return {
    type: ACT_BT,
    id: id,
  };
}
function act_unbt(id) {
  return {
    type: ACT_UNBT,
    id: id,
  };
}
function act_fav(id) {
  return {
    type: ACT_FAV,
    id: id,
  };
}
function act_unfav(id) {
  return {
    type: ACT_UNFAV,
    id: id,
  };
}
function act_notify(notify) {
  return {
    type: ACT_NOTIFY,
    notify: notify,
  };
}
function act_add_notifies(notifies) {
  return {
    type: ACT_ADD_NOTIFIES,
    notifies: notifies,
  };
}
function act_update_config(config) {
  return {
    type: ACT_UPDATE_CONFIG,
    config: config,
  };
}

/**
 * reducer
 */
function toots(state = [], action) {
  switch (action.type) {
    case ACT_ADD:
      return action.toots.concat(state);
    case ACT_UPDATE:
      // TBD
      return state;
    case ACT_DELETE:
      var new_state = [];
      state.forEach((v, i, a) => {
        if (v.id != action.id) {
          new_state.push(v);
        }
      });
      return new_state;
    case ACT_BT:
      var new_state = [];
      state.forEach((v, i, a) => {
        if (v.id == action.id) {
          v.bt_count++;
          v.boosted = true;
        }
        new_state.push(v);
      });
      return new_state;
    case ACT_UNBT:
      var new_state = [];
      state.forEach((v, i, a) => {
        if (v.id == action.id) {
          v.bt_count--;
          v.boosted = false;
        }
        new_state.push(v);
      });
      return new_state;
    case ACT_FAV:
      var new_state = [];
      state.forEach((v, i, a) => {
        if (v.id == action.id) {
          v.fav_count++;
          v.faved = true;
        }
        new_state.push(v);
      });
      return new_state;
    case ACT_UNFAV:
      var new_state = [];
      state.forEach((v, i, a) => {
        if (v.id == action.id) {
          v.fav_count--;
          v.faved = false;
        }
        new_state.push(v);
      });
      return new_state;
    default:
      return state;
  }
}

function notifies(state = [], action) {
  switch (action.type) {
    case ACT_ADD_NOTIFIES:
      return action.notifies.concat(state);
    case ACT_NOTIFY:
      return ([action.notify]).concat(state);
    default:
      return state;
  }
}

function config(state = initialConfigState, action) {
  switch (action.type) {
    case ACT_UPDATE_CONFIG:
      return Object.assign({}, state, action.config);
    default:
      return state;
  }
}

const reducer = combineReducers({
  toots,
  notifies,
  config,
});

/**
 * store
 */
const store = createStore(reducer, {});

/*
store.subscribe(() => {
  // listener
  // get state.
  store.getState();
});
*/

/**
 * view (container component)
 */
// home timeline.
class TootBox extends React.Component {
  render() {
    return (
      <div className="tootbox">
        { this.props.toots.map((toot) =>
          <OneToot toot={ toot }
                   onBT={ this.props.onBT }
                   onFav={ this.props.onFav } />
        )}
      </div>
    );
  }
}
TootBox.propTypes = {
  toots: React.PropTypes.array,
  onBT: React.PropTypes.func.isRequired,
  onFav: React.PropTypes.func.isRequired,
};

// connect react to redux
const TootBoxContainer = connect(
  (state) => {
    return {
      toots: state.toots,
    };
  }
)(TootBox);

/**
 * view (presentational component)
 */
// each toot
class OneToot extends React.Component {
  constructor(){
    super();
    // bind 'this'.
    this.bt = this.bt.bind(this);
    this.fav = this.fav.bind(this);
  }
  bt(e) {
    this.props.onBT(e.currentTarget.getAttribute('data-id'));
  }
  fav(e) {
    this.props.onFav(e.currentTarget.getAttribute('data-id'));
  }
  render() {
    const toot = this.props.toot;
    let boost_avatar = null;
    if (toot.boosted_by_avatar) {
      boost_avatar = (
        <div className="boost_avatar" style={{ backgroundImage: "url(" + toot.boosted_by_avatar + ")"}}></div>
      );
    }
    let media = null;
    if (toot.media_attachments) {
      media =  toot.media_attachments.map((media_attachment) =>
        <MediaAttachment media={media_attachment} />
      );
    }
    let toot_time = createTimeStr(toot.time);
    let btn_bt_className = 'btn bt' + ((toot.boosted) ? ' bted' : '');
    let btn_fav_className = 'btn fav' + ((toot.faved) ? ' faved' : '');
    return(
      <article className="toot">
        <div className="toot">
          <div className="avatar" style={{ backgroundImage: "url(" + toot.avatar + ")"}}></div>
          { boost_avatar }
          <div className="name-area">
            <div className="toot-time">{ toot_time }</div>
            <div className="account">
              <span className="display-name">{ toot.displayName }</span>&nbsp;
              <span className="account-name">@{ toot.account }</span>
            </div>
          </div>
          <div className="message-area">
            <TootMessage msg={ toot } />
            { media }
          </div>
          <div className="btn-area">
            <div className={ btn_bt_className } onClick={ this.bt } data-id={ toot.id }>BT: { toot.bt_count }</div>
            <div className={ btn_fav_className } onClick={ this.fav } data-id={ toot.id }>Fav: { toot.fav_count }</div>
          </div>
        </div>
      </article>
    );
  }
}
OneToot.propTypes = {
  onBT: React.PropTypes.func.isRequired,
  onFav: React.PropTypes.func.isRequired,
};

// toot message
class TootMessage extends React.Component {
  render() {
    const msg = this.props.msg;
    let spoiler_text = (msg.sensitive) ? (<div>{ msg.spoiler_text }</div>) : null;
    let show_btn = (msg.sensitive) ? (<div><span className="show-btn" onClick={ () => {
      this.setState({ show_sensitive: true })
    }}>表示する</span></div>) : null;
    let toot_message = (!msg.sensitive || msg.show_sensitive) ? (
      <div dangerouslySetInnerHTML={{ __html: msg.message }}></div>
    ) : null;

    return (
      <div>
        { spoiler_text }
        { show_btn }
        { toot_message }
      </div>
    );
  }
}

// attached media.
class MediaAttachment extends React.Component {
  render() {
    return(
      <img src={ this.props.media.preview_url } />
    );
  }
}

/**
 * toot post view
 */
class TootPost extends React.Component {
  toot() {
    var msg = document.getElementById('toot_textbox').value;
    if (msg == '') return;

    var m = new Mastodon(access_token, host);
    m.post('statuses', { status: msg });
  }
  render() {
    return(
      <div>
        <TootInputTextBox />
        <TootButton handleClick={ this.toot }/>
      </div>
    );
  }
}

class TootInputTextBox extends React.Component {
  resizeHeight(ev) {
    var t = ev.target;
    if (t.scrollHeight > t.offsetHeight) {
      t.style.height = t.scrollHeight + 'px';
    }
  }
  render() {
    return(
      <div className="toot-post-parts">
        <div className="outer-textarea">
          <textarea
            style={{height: '1ex'}}
            onKeyUp={(ev) => this.resizeHeight(ev)}
            onCopy={(ev) => this.resizeHeight(ev)}
            id='toot_textbox'  /* bad manner */
          ></textarea>
        </div>
      </div>
    );
  }
}

class TootButton extends React.Component {
  render() {
    return(
      <div className="toot-post-parts">
        <div className="btn toot-btn" onClick={() => { this.props.handleClick(); }}>Toot</div>
      </div>
    );
  }
}

/**
 * notify view
 */
class NotifyBox extends React.Component {
  render() {
    return (
      <div className="tootbox">
        { this.props.notifies.map((notify) =>
          <OneNotify notify={ notify } />
        )}
      </div>
    );
  }
}
// connect react to redux
const NotifyBoxContainer = connect(
  (state) => {
    return {
      notifies: state.notifies,
    };
  }
)(NotifyBox);

/**
 * view (presentational component)
 */
// each notify
class OneNotify extends React.Component {
  render() {
    const notify = this.props.notify;
    let msg = "";
    switch(notify.type) {
      case 'favourite':
        msg = notify.notified_by.display_name + 'さんにふぁぼられました。';
        break;
      case 'reblog':
        msg = notify.notified_by.display_name + 'さんにBTされました。';
        break;
      case 'follow':
        msg = notify.notified_by.display_name + 'さんにフォローされました。';
        break;
    }
    let notify_time = createTimeStr(notify.time);
    let toot = (!notify.target_toot) ? null : (
      <div className="your-toot">
        <div className="your-toot-msg" dangerouslySetInnerHTML={{ __html: notify.target_toot.content }}></div>
      </div>
    );
    return (
      <article className="notify">
        <div className="notify-title">
          <div className="notify-avatar" style={{ backgroundImage: "url(" + notify.notified_by.avatar + ")"}}></div>
          <div className="notify-msg">{ msg } <span className="notify-time">({ notify_time })</span></div>
        </div>
        { toot }
      </article>
    );
  }
}

/**
 * setting view
 */
class Settings extends React.Component {
  render() {
    return(
      <div>
        <SettingsColorTheme handleChange={ this.props.changeConfig } color_theme={ this.props.config.color_theme } />
        <ColorThemeStyle color_theme={ this.props.config.color_theme } />
      </div>
    );
  }
}
Settings.propTypes = {
  changeConfig: React.PropTypes.func.isRequired,
  config: React.PropTypes.object,
};

// connect react to redux
const SettingsContainer = connect(
  (state) => {
    return {
      config: state.config,
    };
  },
  (dispatch) => {
    return {
      changeConfig(config) {
        dispatch(act_update_config(config));
      },
    };
  }
)(Settings);

/**
 * change color view
 */
class SettingsColorTheme extends React.Component {
  render() {
    return(
      <div>
        <label>
          <input type="radio" name="color-theme" value="dark" checked={ this.props.color_theme === 'dark'}
            onChange={() => {
              this.props.handleChange({ color_theme: 'dark' });
            }} />
          dark
        </label>
        <label>
          <input type="radio" name="color-theme" value="bright" checked={this.props.color_theme === 'bright'}
            onChange={() => {
              this.props.handleChange({ color_theme: 'bright' });
            }} />
          bright
        </label>
      </div>
    );
  }
}

/**
 * css view
 */
class ColorThemeStyle extends React.Component {
  render() {
    if (this.props.color_theme === 'dark') {
      return <link rel='stylesheet' type='text/css' href='css/cl_dark.css' />
    } else {
      return <link rel='stylesheet' type='text/css' href='css/cl_bright.css' />
    }
  }
}

/*
 * Tab Selector
 */
class AppTab extends React.Component {
  componentDidMount() {
    // render UI parts after div is mounted.
    ReactDOM.render(
      <Provider store={ store }>
        <TootBoxContainer onBT={ this.props.onBT } onFav={ this.props.onFav }/>
      </Provider>,
      document.getElementById('home_timeline')
    );
    ReactDOM.render(
      <Provider store={ store }>
        <NotifyBoxContainer />
      </Provider>,
      document.getElementById('notify_area')
    );
    ReactDOM.render(
      <Provider store={ store }>
        <SettingsContainer />
      </Provider>,
      document.getElementById('settings_area')
    );
  }
  render() {
    return(
      <Tabs forceRenderTabPanel={ true }>
        <TabList>
          <Tab>HTL</Tab>
          <Tab>Notify</Tab>
          <Tab>Setting</Tab>
        </TabList>
        <TabPanel><div id="home_timeline" className="tab-area"></div></TabPanel>
        <TabPanel><div id="notify_area" className="tab-area"></div></TabPanel>
        <TabPanel><div id="settings_area" className="tab-area"></div></TabPanel>
      </Tabs>
    );
  }
}
AppTab.propTypes = {
  onBT: React.PropTypes.func.isRequired,
  onFav: React.PropTypes.func.isRequired,
};

/**
 * App
 */
class App extends React.Component {
  constructor(){
    super();
    // instance variables.
    this.m = new Mastodon(access_token, host);
    // bind this.
    this.bt = this.bt.bind(this);
    this.fav = this.fav.bind(this);
  }
  createTootObj(toot) {
    var t = {
      id: toot.id, /* unique id */
      avatar: (toot.reblog) ? toot.reblog.account.avatar : toot.account.avatar,
      displayName: (toot.reblog) ? toot.reblog.account.display_name : toot.account.display_name,
      account: (toot.reblog) ? toot.reblog.account.acct : toot.account.acct,
      message: toot.content,
      media_attachments: null,
      time: new Date(toot.created_at),
      bt_count: (toot.reblog) ? toot.reblog.reblogs_count : toot.reblogs_count,
      boosted: (toot.reblog) ? toot.reblog.reblogged : toot.reblogged,
      fav_count: (toot.reglog) ? toot.reblog.favourites_count : toot.favourites_count,
      faved: (toot.reblog) ? toot.reblog.favourited : this.favourited,
      sensitive: (toot.reblog) ? toot.reblog.sensitive : toot.sensitive,
      spoiler_text: (toot.reblog) ? toot.reblog.spoiler_text : toot.spoiler_text,
      boosted_by_avatar: (toot.reblog) ? toot.account.avatar : null,
    };
    var media_attachments = (toot.reblog) ? toot.reblog.media_attachments : toot.media_attachments;
    if (media_attachments.length > 0) {
      var ms = [];
      media_attachments.forEach((media_attachment) => {
        ms.push({
          preview_url: media_attachment.preview_url,
          url: media_attachment.url
        });
      });
      t.media_attachments = ms;
    }
    return t;
  }
  loadTimeLine() {
    fetch('https://' + host + '/api/v1/timelines/home?access_token=' + access_token, {
      method: 'GET',
    })
    .then((response) => response.json())
    .then((responseJson) => {
      var toots = [];
      responseJson.forEach((toot) => {
        toots.push(this.createTootObj(toot));
      });
      this.props.addToots(toots);
    })
    .catch((error) => {
      console.error(error)
    });
  }
  createNotifyObj(notify) {
    var n = {
      id: notify.id,
      type: notify.type,
      notified_by: {
        display_name: notify.account.display_name,
        account: notify.account.acct,
        avatar: notify.account.avatar,
      },
      time: new Date(notify.created_at),
    };
    if (notify.type === 'favourite' || notify.type === 'reblog') {
      n.target_toot = {
        id: notify.status.id,
        content: notify.status.content,
      };
    }
    return n;
  }
  loadNotifies() {
    fetch('https://' + host + '/api/v1/notifications?access_token=' + access_token, {
      method: 'GET',
    })
    .then((response) => response.json())
    .then((responseJson) => {
      var notifies = [];
      responseJson.forEach((notify) => {
        notifies.push(this.createNotifyObj(notify));
      });
      this.props.addNotifies(notifies);
    })
    .catch((error) => {
      console.error(error)
    });
  }
  bt(id) {
    var bst = true;  // true is 'boost', false is 'unboost'
    this.props.toots.forEach((toot) => {
      if (toot.id == id) {
        if (toot.reblogged) bst = false;
      }
    });
    if (bst) {
      this.m.post('statuses/' + id + '/reblog');
      this.props.btToot(id);
    } else {
      this.m.post('statuses/' + id + '/unreblog');
      this.props.unbtToot(id);
    }
  }
  fav(id) {
    var fav = true;  // true is 'fav', false is 'unfav'
    this.props.toots.forEach((toot) => {
      if (toot.id == id) {
        if (toot.faved) fav = false;
      }
    });
    if (fav) {
      this.m.post('statuses/' + id + '/favourite');
      this.props.favToot(id);
    } else {
      this.m.post('statuses/' + id + '/unfavourite');
      this.props.unfavToot(id);
    }
  }
  connectWebSocket() {
    var ws = new WebSocket('wss://' + host + '/api/v1/streaming/?access_token=' + access_token + '&stream=user');
    ws.onmessage = (message) => {
      var d = eval('(' + message.data + ')');
      var p = eval('(' + d.payload + ')');
      switch(d.event) {
        case 'update':
          var t = this.createTootObj(p);
          this.props.addToots([t]);
          break;
        case 'delete':
          this.props.delToot(p);
          break;
        case 'notification':
          this.props.notify(this.createNotifyObj(p));
          break;
      }
    }
  }
  componentDidMount() {
    this.loadTimeLine();
    this.loadNotifies();
    this.connectWebSocket();
  }
  render() {
    return(
      <AppTab onBT={ this.bt } onFav={ this.fav }/>
    );
  }
}
App.propTypes = {
  toots: React.PropTypes.array,
  addToots: React.PropTypes.func,
  delToot: React.PropTypes.func,
  btToot: React.PropTypes.func,
  unbtToot: React.PropTypes.func,
  favToot: React.PropTypes.func,
  unfavToot: React.PropTypes.func,
  addNotifies: React.PropTypes.func,
  notify: React.PropTypes.func,
};

// connect react to redux
const AppContainer = connect(
  (state) => {
    return {
      toots: state.toots,
      notifies: state.notifies,
    };
  },
  (dispatch) => {
    return {
      addToots(toots) {
        dispatch(act_add(toots));
      },
      delToot(id) {
        dispatch(act_delete(id));
      },
      btToot(id) {
        dispatch(act_bt(id));
      },
      unbtToot(id) {
        dispatch(act_unbt(id));
      },
      favToot(id) {
        dispatch(act_fav(id));
      },
      unfavToot(id) {
        dispatch(act_unfav(id));
      },
      addNotifies(notifies) {
        dispatch(act_add_notifies(notifies));
      },
      notify(n) {
        dispatch(act_notify(n));
      },
    };
  }
)(App);

ReactDOM.render(
  <Provider store={ store }>
    <AppContainer />
  </Provider>,
  document.getElementById('tab_area')
);

ReactDOM.render(
  <TootPost />,
  document.getElementById('toot_post')
);

/**
 * util
 */
function createTimeStr(date) {
  var time = '';
  time = date.getFullYear() + '/'
    + ('0' + (date.getMonth() + 1)).slice(-2) + '/'
    + ('0' + date.getDate()).slice(-2) + ' '
    + ('0' + date.getHours()).slice(-2) + ':'
    + ('0' + date.getMinutes()).slice(-2) + ':'
    + ('0' + date.getSeconds()).slice(-2);
  return time;
}
