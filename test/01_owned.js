const truffleAssertions = require('truffle-assertions');
const Owned = artifacts.require('Owned');

contract('Owned', async (accounts) => {
  describe('Owner tests', async () => {
    let instance;
    before(async () => {
      instance = await Owned.new(accounts[0]);
    });

    it('only owner should be able to propose a new owner', async () => {
      await truffleAssertions.fails(
        instance.proposeOwner(accounts[1], { from: accounts[1] }),
        truffleAssertions.ErrorType.REVERT
      );
    });

    it('owner should be able to propose a new owner', async () => {
      assert.equal(
        await instance.proposedOwner(),
        '0x0000000000000000000000000000000000000000'
      );
      await instance.proposeOwner(accounts[1]);
      assert.equal(await instance.proposedOwner(), accounts[1]);
    });

    it('only proposed owner should be able to accept ownership', async () => {
      assert.equal(await instance.owner(), accounts[0]);
      await truffleAssertions.fails(
        instance.claimOwnership(),
        truffleAssertions.ErrorType.REVERT
      );
      await truffleAssertions.fails(
        instance.claimOwnership({ from: accounts[2] }),
        truffleAssertions.ErrorType.REVERT
      );
      await instance.claimOwnership({ from: accounts[1] });
      assert.equal(await instance.owner(), accounts[1]);
    });
  });
});
