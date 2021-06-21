const truffleAssertions = require('truffle-assertions');
const EthSplitter = artifacts.require('EthSplitter');

contract('EthSplitter', async (accounts) => {
  describe('Recipient management', async () => {
    let instance;
    before(async () => {
      instance = await EthSplitter.new(accounts[0]);
    });

    it('only owner should be able to add or remove a recipient', async () => {
      await truffleAssertions.fails(
        instance.addRecipient(accounts[4], { from: accounts[1] }),
        truffleAssertions.ErrorType.REVERT
      );
      await truffleAssertions.fails(
        instance.removeRecipient(accounts[1], { from: accounts[1] }),
        truffleAssertions.ErrorType.REVERT
      );
    });

    it('should not be able to add recipients', async () => {
      const tx = await instance.addRecipient(accounts[1]);
      await instance.addRecipient(accounts[2]);
      await instance.addRecipient(accounts[3]);
      assert.strictEqual((await instance.indices(accounts[1])).toString(), '1');
      assert.strictEqual((await instance.indices(accounts[2])).toString(), '2');
      assert.strictEqual((await instance.indices(accounts[3])).toString(), '3');
      assert.deepEqual(await instance.getAllRecipients(), [
        accounts[1],
        accounts[2],
        accounts[3],
      ]);

      truffleAssertions.eventEmitted(tx, 'AddedRecipient', (ev) => {
        return ev.recipient === accounts[1];
      });
    });

    it('should not be able to remove recipients', async () => {
      const tx = await instance.removeRecipient(accounts[1]);
      assert.strictEqual((await instance.indices(accounts[1])).toString(), '0');
      assert.strictEqual((await instance.indices(accounts[2])).toString(), '2');
      assert.strictEqual((await instance.indices(accounts[3])).toString(), '1');
      assert.deepEqual(await instance.getAllRecipients(), [
        accounts[3],
        accounts[2],
      ]);

      truffleAssertions.eventEmitted(tx, 'RemovedRecipient', (ev) => {
        return ev.recipient === accounts[1];
      });
    });

    it('should not be able to add an already existing recipient', async () => {
      await truffleAssertions.fails(
        instance.addRecipient(accounts[2]),
        truffleAssertions.ErrorType.REVERT,
        'already recipient'
      );
    });

    it('should not be able to remove a non existent recipient', async () => {
      await truffleAssertions.fails(
        instance.removeRecipient(accounts[4]),
        truffleAssertions.ErrorType.REVERT,
        'not recipient'
      );
    });

    it('should be able to remove last element of the array', async () => {
      await truffleAssertions.passes(instance.removeRecipient(accounts[2]));
      assert.strictEqual((await instance.indices(accounts[2])).toString(), '0');
      assert.deepEqual(await instance.getAllRecipients(), [accounts[3]]);
    });

    it('should be able to remove all recipients', async () => {
      await truffleAssertions.passes(instance.removeRecipient(accounts[3]));
      assert.strictEqual((await instance.indices(accounts[3])).toString(), '0');
      assert.deepEqual(await instance.getAllRecipients(), []);
    });
  });
});
