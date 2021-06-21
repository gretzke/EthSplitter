const truffleAssertions = require('truffle-assertions');
const EthSplitterFactoryV2 = artifacts.require('EthSplitterFactoryV2');
const Splitter = artifacts.require('EthSplitterClonable');
const SimpleContract = artifacts.require('SimpleContract');

contract('EthSplitterFactoryV2', async (accounts) => {
  let factory;
  let instance;

  before(async () => {
    const clonableSplitter = await Splitter.new();
    factory = await EthSplitterFactoryV2.new(clonableSplitter.address);
  });

  describe('Create splitter', async () => {
    it('should be able to create a new splitter', async () => {
      const tx = await factory.createSplitter();
      truffleAssertions.eventEmitted(tx, 'SplitterCreated', async (ev) => {
        instance = await Splitter.at(ev.splitter);
        return true;
      });
    });

    it('should not be able to create a new splitter if user already created one', async () => {
      await truffleAssertions.fails(
        factory.createSplitter(),
        truffleAssertions.ErrorType.REVERT,
        'every user can only create one splitter'
      );
    });
  });

  describe('Recipient management', async () => {
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

  describe('Split funds', async () => {
    it('should do nothing if list of recipients is empty', async () => {
      await truffleAssertions.passes(instance.split());
    });

    it('should do nothing if list of recipients is not empty and balance is zero', async () => {
      await instance.addRecipient(accounts[1]);
      await instance.addRecipient(accounts[2]);
      await truffleAssertions.passes(instance.split());
    });

    it('contract should accept eth transfers', async () => {
      await instance.send('11', { from: accounts[0] });
      assert.strictEqual(await web3.eth.getBalance(instance.address), '11');
    });

    it('split function should transfer funds accordingly', async () => {
      const balance1 = web3.utils.toBN(await web3.eth.getBalance(accounts[1]));
      const balance2 = web3.utils.toBN(await web3.eth.getBalance(accounts[2]));
      const tx = await instance.split();
      assert.strictEqual(
        web3.utils
          .toBN(await web3.eth.getBalance(accounts[1]))
          .sub(balance1)
          .toString(),
        '5'
      );
      assert.strictEqual(
        web3.utils
          .toBN(await web3.eth.getBalance(accounts[2]))
          .sub(balance2)
          .toString(),
        '5'
      );
      truffleAssertions.eventEmitted(tx, 'EthSplit', (ev) => {
        return ev.amount.toString() === '10';
      });
    });

    it('split should fail if a transfer to a recipient fails', async () => {
      const s = await SimpleContract.new();
      await instance.addRecipient(s.address);
      await instance.send('11', { from: accounts[0] });
      await truffleAssertions.fails(
        instance.split(),
        truffleAssertions.ErrorType.REVERT,
        'a transfer failed'
      );
    });
  });
});
