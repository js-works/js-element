import { css } from '../../../main/index'

export default css`
  .jsc-cockpit {
    display: flex;
    flex-direction: column;
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .jsc-cockpit__header {
    display: flex;
    flex-direction: row;
    height: 40px;
  }

  .jsc-cockpit__header--default-color {
    color: white;
    background-color: #002538;
  }

  .jsc-cockpit__header--blue {
    color: white;
    background-color: #006690;
  }

  .jsc-cockpit__header--orange {
    color: black;
    background-color: #DE400F;
  }

 .jsc-cockpit__header--teal {
    color: white;
    background-color: #007E7A;
  }

  .jsc-cockpit__brand {
  }

  .jsc-cockpit__top-navi {
    flex-grow: 1;
  }

  .jsc-cockpit__action-area {
  }

  .jsc-cockpit__content {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
  }

  .jsc-cockpit__sidebar {
    width: 200px;
  }

  .jsc-cockpit__main {
    flex-grow: 1;
  }
`
