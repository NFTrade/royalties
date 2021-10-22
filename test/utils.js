/* eslint-disable no-undef */
const BigNumber = require('bignumber.js');

const itShouldThrow = (reason, fun, expectedMessage) => {
  it(reason, async () => {
    let error = false;
    try {
      await Promise.resolve(fun()).catch((e) => {
        error = e;
      });
    } catch (e) {
      error = e;
    }

    // No error was returned or raised - make the test fail plain and simple.
    if (!error) {
      assert.ok(false, 'expected to throw, did not');
    }

    // No exception message was provided, we'll only test against the important VM ones.
    if (expectedMessage === undefined) {
      assert.match(
        error.message,
        /invalid JUMP|invalid opcode|out of gas|The contract code couldn't be stored, please check your gas amount/
      );
      // An expected exception message was passed - match it.
    } else if (error.message.length > 0) {
      // Get the error message from require method within the contract
      const errorReason = error.message.match('Reason given: (.*)\\.');
      // If there's no message error provided, check for default errors
      if (errorReason === null) {
        assert.ok(
          error.message.indexOf(expectedMessage) >= 0,
          'threw the wrong exception type'
        );
      } else {
        assert.equal(
          expectedMessage,
          errorReason[1],
          'threw the wrong exception type'
        );
      }
      // In case that nothing matches!
    } else {
      assert.ok(
        false,
        `something went wrong with asserts. Given error ${error}`
      );
    }
  });
};

const advanceTime = (time) => new Promise((resolve, reject) => {
  web3.currentProvider.send(
    {
      jsonrpc: '2.0',
      method : 'evm_increaseTime',
      params : [time],
      id     : new Date().getTime(),
    },
    (err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    }
  );
});

const advanceBlock = () => new Promise((resolve, reject) => {
  web3.currentProvider.send(
    {
      jsonrpc: '2.0',
      method : 'evm_mine',
      id     : new Date().getTime(),
    },
    (err, result) => {
      if (err) {
        return reject(err);
      }
      const newBlockHash = web3.eth.getBlock('latest').hash;

      return resolve(newBlockHash);
    }
  );
});

const takeSnapshot = () => new Promise((resolve, reject) => {
  web3.currentProvider.send(
    {
      jsonrpc: '2.0',
      method : 'evm_snapshot',
      id     : new Date().getTime(),
    },
    (err, snapshotId) => {
      if (err) {
        return reject(err);
      }
      return resolve(snapshotId);
    }
  );
});

const revertToSnapShot = (id) => new Promise((resolve, reject) => {
  web3.currentProvider.send(
    {
      jsonrpc: '2.0',
      method : 'evm_revert',
      params : [id],
      id     : new Date().getTime(),
    },
    (err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    }
  );
});

const advanceTimeAndBlock = async (time) => {
  await advanceTime(time);
  await advanceBlock();
  return Promise.resolve(web3.eth.getBlock('latest'));
};

module.exports = {
  itShouldThrow,
  advanceTime,
  advanceBlock,
  advanceTimeAndBlock,
  takeSnapshot,
  revertToSnapShot,
};
