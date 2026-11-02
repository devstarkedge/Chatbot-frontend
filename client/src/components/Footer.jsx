import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <span>
        Connected to MongoDB Cluster <code>cluster0.dmixu3k.mongodb.net</code> &bull; DB:{' '}
        <code>test_copy</code> &bull; Collection: <code>users</code>
      </span>
    </footer>
  );
}

export default Footer;
