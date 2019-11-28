import React, {Component} from 'react';
import {Spinner} from "react-bootstrap";

class Loader extends Component {
  render() {
    return (
      <div>
        <Spinner animation="border" role="status">
          <span className="sr-only">Загрузка...</span>
        </Spinner>
      </div>
    );
  }
}

export default Loader;