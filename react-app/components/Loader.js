import React, {Component} from 'react';
import {Spinner} from "react-bootstrap";

/**
 * Класс, отображающий анимацию загрузки компонентов
 * @class Loader
 * @category client
 */
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