import { assert } from 'chai';
import sinon from 'sinon';
import framework from '../';

const _events   = framework.initialize().events;

describe('events', function() {
  describe('on function', function() {

    it('Should register an event with a callback', function() {
      let eventSpy = sinon.spy();
      _events.on('testEvent', eventSpy);
      _events.trigger('testEvent');
      assert(eventSpy.calledOnce, 'Event fired more than once');
      _events.off('testEvent', eventSpy);
    });
  });

  describe('off function', function() {
    it('Should unregister an event ', function() {
      let eventSpy = sinon.spy();
      _events.on('testEvent', eventSpy);
      _events.off('testEvent', eventSpy);
      _events.trigger('testEvent');
      assert.equal(eventSpy.called, false, 'Event did not fire.');
    });
  });

  describe('trigger function', function() {
    it('Should trigger an event ', function() {
      let eventSpy = sinon.spy();
      _events.on('testEvent', eventSpy);

      _events.trigger('testEvent');
      assert(eventSpy.called, 'Event did not fire.');
      _events.off('testEvent', eventSpy);
    });
  });

  describe('once function', function() {
    it('Should register an event just once', function() {
      let eventSpy = sinon.spy();
      _events.once('testEvent', eventSpy);
      // needs to be fixed
      _events.trigger('testEvent');
      assert(eventSpy.called, 'Event is fired.');
      assert.equal(_events.eventsCount('testEvent'), 0);
      _events.trigger('testEvent');
      _events.off('testEvent', eventSpy);
    });
  });

  describe('eventsCount function', function() {
    it('Should return the number of events registered', function() {
      let fn1 = function() {
            let hello = 1;

            return hello + 1;
          },
          fn2 = function() {
            return true;
          },
          count;

      _events.once('testEvent', fn2);
      _events.on('testEvent', fn1);

      count = _events.eventsCount('testEvent');
      assert.equal(count, 2);

      _events.off('testEvent', fn1);
      _events.off('testEvent', fn2);
      count = _events.eventsCount('testEvent');
      assert.equal(count, 0);
    });
  });
});
