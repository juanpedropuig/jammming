let accessToken;
const clientID = 'eaefde2fdcf9410b965b73d1b2ab0a79';
const redirectURI = 'https://jummmy.surge.sh/';

const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    }

    // Checks for access token match
    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
    if (accessTokenMatch && expiresInMatch) {
      accessToken = accessTokenMatch[1];
      const expiresIn = Number(expiresInMatch[1]);
      // This clears the parameter, allowing us to grab a new access token when it expires.
      window.setTimeout(() => accessToken = '', expiresIn * 1000);
      window.history.pushState('AccessToken', null, '/');
      return accessToken;
    } else {
      const accessURL = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
      window.location = accessURL;
    }
  },

  search(term) {
    accessToken = Spotify.getAccessToken();
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(response => response.json())
      .then(jsonResponse => {
        if (!jsonResponse.tracks) {
          return [];
        }
        return jsonResponse.tracks.items.map(track => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          uri: track.uri
        }))
      })
  },

  savePlaylist(playlistName, trackURIs) {
    if (!playlistName || !trackURIs.length) {
      return;
    }

    const accessToken = Spotify.getAccessToken();
    const headers = { Authorization: `Bearer ${accessToken}` };
    let userID;

    return fetch('https://api.spotify.com/v1/me', { headers })
      .then(response => response.json())
      .then(jsonResponse => {
        userID = jsonResponse.id;
        return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, 
        {
          headers,
          method: 'POST',
          body: JSON.stringify({ name: playlistName })
        })
      })
      .then(response => response.json())
      .then(jsonResponse => {
        const playlistID = jsonResponse.id;
        return fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`, 
        {
          headers,
          method: 'POST',
          body: JSON.stringify({ uris: trackURIs })
        })
      })
  }
}

export default Spotify;