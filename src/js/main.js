import React from 'react';
import ReactDOM from 'react-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

var host = 'HOSTNAME';
var access_token = 'ACCESS_TOKEN';

/*
 * HTL Tab
 */
class TootBox extends React.Component {
  constructor() {
    super();
    this.state = {
      toots: []
    };
  }
  createTootObj(toot) {
    var t = {
      avatar: toot.account.avatar,
      displayName: toot.account.display_name,
      account: toot.account.acct,
      message: toot.content,
      media_attachments: null,
      time: new Date(toot.created_at),
      bt_count: toot.reblogs_count,
      fav_count: toot.favourites_count,
      sensitive: toot.sensitive,
      spoiler_text: toot.spoiler_text,
    };
    if (toot.media_attachments.length > 0) {
      var ms = [];
      toot.media_attachments.forEach((media_attachment) => {
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
      this.setState({
        toots: toots
      });
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
      if (d.event == 'update') {
        var t = this.createTootObj(p);
        this.setState({
          toots: ([t]).concat(this.state.toots)
        });
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
        { this.state.toots.map((toot) =>
          <OneToot toot={ toot } />
        )}
      </div>
    );
  }
}

class OneToot extends React.Component {
  constructor() {
    super();
    this.state = {
    };
  }
  render() {
    const toot = this.props.toot;
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

class TootMessage extends React.Component {
  constructor() {
    super();
    this.state = {
      show_sensitive: false /* true: shown, false: hidden */
    }
  }
  render() {
    const msg = this.props.msg;
    let spoiler_text = (msg.sensitive) ? (<div>{ msg.spoiler_text }</div>) : null;
    let show_btn = (msg.sensitive) ? (<div><span className="show-btn" onClick={ () => {
      this.setState({ show_sensitive: true })
    }}>表示する</span></div>) : null;
    let toot_message = (!msg.sensitive || this.state.show_sensitive) ? (
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

class MediaAttachment extends React.Component {
  render() {
    return(
      <img src={ this.props.media.preview_url } />
    );
  }
}

/*
 * Setting Tab
 */
class Settings extends React.Component {
  constructor() {
    super();
    this.state = {
      color_theme: 'dark'
    };
  }
  changeColorTheme(theme) {
    var l = document.getElementById('color_theme');
    switch(theme) {
      case 'dark':
        l.href = 'css/cl_dark.css';
        break;
      case 'bright':
        l.href = 'css/cl_bright.css';
        break;
    }
  }
  render() {
    return(
      <div>
        <label>
          <input type="radio" name="color-theme" value="dark" checked={this.state.color_theme === 'dark'}
            onChange={() => {
              this.setState({ color_theme: 'dark' });
              this.changeColorTheme('dark');
            }} />
          dark
        </label>
        <label>
          <input type="radio" name="color-theme" value="bright" checked={this.state.color_theme === 'bright'}
            onChange={() => {
              this.setState({ color_theme: 'bright' });
              this.changeColorTheme('bright');
            }} />
          bright
        </label>
      </div>
    );
  }
}

/*
 * Tab Selector
 */
class AppTab extends React.Component {
  componentDidMount() {
    // render home timeline after div is mounted.
    ReactDOM.render(
      <TootBox />,
      document.getElementById('home_timeline')
    );
    ReactDOM.render(
      <Settings />,
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
