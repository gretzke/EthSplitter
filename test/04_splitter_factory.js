const truffleAssertions = require('truffle-assertions');
const EthSplitterFactory = artifacts.require('EthSplitterFactory');

contract('EthSplitterFactory', async (accounts) => {
  describe('Create splitter', async () => {
    let instance;
    before(async () => {
      instance = await EthSplitterFactory.new();
    });

    it('should be able to create a new splitter', async () => {
      const tx = await instance.createSplitter();
      truffleAssertions.eventEmitted(tx, 'SplitterCreated');
    });

    it('should not be able to create a new splitter if user already created one', async () => {
      await truffleAssertions.fails(
        instance.createSplitter(),
        truffleAssertions.ErrorType.REVERT,
        'every user can only create one splitter'
      );
    });
  });
});
