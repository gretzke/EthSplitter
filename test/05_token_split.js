const truffleAssertions = require('truffle-assertions');
const EthAndTokenSplitter = artifacts.require('EthAndTokenSplitter');
const Token = artifacts.require('ERC677');

contract('EthAndTokenSplitter', async (accounts) => {
  describe('Split tokens', async () => {
    let token;
    let instance;
    before(async () => {
      token = await Token.new(accounts[0], '1000', 'Test Token', 'TST');
      instance = await EthAndTokenSplitter.new(accounts[0]);
    });

    it('should do nothing if list of recipients is empty', async () => {
      await truffleAssertions.passes(instance.splitTokens(token.address));
    });

    it('should do nothing if list of recipients is not empty and balance is zero', async () => {
      await instance.addRecipient(accounts[1]);
      await instance.addRecipient(accounts[2]);
      await truffleAssertions.passes(instance.splitTokens(token.address));
    });

    it('split function should transfer tokens upon receival', async () => {
      const balance1 = await token.balanceOf(accounts[1]);
      const balance2 = await token.balanceOf(accounts[2]);
      const tx = await token.transferAndCall(instance.address, '11', []);
      const splitterEvents = await truffleAssertions.createTransactionResult(
        instance,
        tx.tx
      );

      assert.strictEqual(
        (await token.balanceOf(accounts[1])).sub(balance1).toString(),
        '5'
      );
      assert.strictEqual(
        (await token.balanceOf(accounts[2])).sub(balance2).toString(),
        '5'
      );
      truffleAssertions.eventEmitted(splitterEvents, 'TokensSplit', (ev) => {
        return ev.amount.toString() === '10';
      });
    });

    it('contract should accept normal token transfers', async () => {
      await token.transfer(instance.address, '11');
      assert.strictEqual(
        (await token.balanceOf(instance.address)).toString(),
        '12'
      );
    });

    it('should be able to split tokens manually', async () => {
      const tx = await instance.splitTokens(token.address);
      truffleAssertions.eventEmitted(tx, 'TokensSplit', (ev) => {
        return ev.amount.toString() === '12';
      });
    });
  });
});
