const EventEmitter = require('events');

export class FakeDataInterval extends EventEmitter {

  constructor(ms, ids) {
    super();
    this.interval = ms;
    this.handle = undefined;
    this.ids = [].concat(ids);
    this.addListener('fire', this.action);
  }
  
  start() {
    if (!this.handle) {
      this.fireEvent()
    }
  }

  add_id(newId) {
    this.ids = [this.ids, ...[newId]]
  }

  remove_id(id) {
    this.ids = this.ids.filter(x => x !== id);
  }

  stop(forced) {
    if (this.handle) {
      clearTimeout(this.handle);
      this.handle = undefined;
    }
    if (forced) {
      console.log("Exit interval due error.")
    }
    console.log("Finished interval")
  }

  fireEvent() {
    this.emit('fire');
  }
  
  emitNextEvent() {
    if (this.handle) {
      clearTimeout(this.handle);
    }
    this.index += 1;
    this.handle = setTimeout(this.fireEvent.bind(this), this.interval);
  }

  action() {
    /* TODO: MAKE ACTION IF NEEDED */
    
    this.emitNextEvent();
  }
}