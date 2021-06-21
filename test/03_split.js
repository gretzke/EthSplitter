const truffleAssertions = require('truffle-assertions');
const EthSplitter = artifacts.require('EthSplitter');
const SimpleContract = artifacts.require('SimpleContract');

contract('EthSplitter', async (accounts) => {
  describe('Split funds', async () => {
    let instance;
    before(async () => {
      instance = await EthSplitter.new(accounts[0]);
    });

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
