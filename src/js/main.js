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
      fav_count: (toot.reglog) ? toot.reblog.favourites_count : toot.favourites_count,
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
      }
    }
  }
  componentDidMount() {
    this.loadTimeLine();
    this.connectWebSocket();
  }
  render() {
    return (
      <div className="tootbox">
        { this.props.toots.map((toot) =>
          <OneToot toot={ toot } />
        )}
      </div>
    );
  }
}
TootBox.propTypes = {
  toots: React.PropTypes.array,
  addToots: React.PropTypes.func,
  delToot: React.PropTypes.func,
};

// connect react to redux
const TootBoxContainer = connect(
  (state) => {
    return {
      toots: state.toots,
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
    };
  }
)(TootBox);

/**
 * view (presentational component)
 */
// each toot
class OneToot extends React.Component {
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
    let toot_time = '';
    toot_time = ('0' + toot.time.getHours()).slice(-2) + ':'
      + ('0' + toot.time.getMinutes()).slice(-2) + ':'
      + ('0' + toot.time.getSeconds()).slice(-2);
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
            <div className="btn bt">BT: { toot.bt_count }</div>
            <div className="btn fav">Fav: { toot.fav_count }</div>
          </div>
        </div>
      </article>
    );
  }
}

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
        <TootBoxContainer />
      </Provider>,
      document.getElementById('home_timeline')
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
        <TabPanel><div id="home_timeline"></div></TabPanel>
        <TabPanel>TODO...</TabPanel>
        <TabPanel><div id="settings_area"></div></TabPanel>
      </Tabs>
    );
  }
}

ReactDOM.render(
  <AppTab />,
  document.getElementById('tab_area')
);

ReactDOM.render(
  <TootPost />,
  document.getElementById('toot_post')
);
