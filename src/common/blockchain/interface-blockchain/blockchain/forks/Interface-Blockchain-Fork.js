const colors = require('colors/safe');
import global from "consts/global"

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchainFork {


    constructor (){
    }

    /**
     * initializeConstructor is used to initialize the constructor dynamically using .apply method externally passing the arguments
     */

    initializeConstructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header){

        this.blockchain = blockchain;

        this.forkId = forkId;

        if (!Array.isArray(sockets))
            sockets = [sockets];

        this.sockets = sockets;
        this.forkStartingHeight = forkStartingHeight||0;

        this.forkChainStartingPoint = forkChainStartingPoint;
        this.forkChainLength = newChainLength||0;
        this.forkBlocks = [];
        this.forkHeader = header;

        this._blocksCopy = [];
    }

    async validateFork(){

        let useFork = false;

        if (this.blockchain.getBlockchainLength < this.forkStartingHeight + this.forkBlocks.length)
            useFork = true;
        else
        if (this.blockchain.getBlockchainLength === this.forkStartingHeight + this.forkBlocks.length) //I need to check
            if (this.forkBlocks[this.forkBlocks.length-1].hash.compare( this.blockchain.getHashPrev(this.blockchain.getBlockchainLength) ) < 0)
                useFork = true;

        if (useFork === false)
            return false;

        for (let i=0; i<this.forkBlocks.length; i++){

            if (! await this.validateForkBlock( this.forkBlocks[i], this.forkStartingHeight + i )) throw "validateForkBlock failed for " + i;

        }

        return true;
    }

    async includeForkBlock(block){

        if (! await this.validateForkBlock(block, block.height ) ) throw "includeForkBlock failed for "+block.height;

        this.forkBlocks.push(block);

        return true;
    }

    /**
     * It Will only validate the hashes of the Fork Blocks
     */
    async validateForkBlock(block, height, blockValidationType){

        //calcuate the forkHeight
        let forkHeight = block.height - this.forkStartingHeight;

        if (block.height < this.forkStartingHeight) throw 'block height is smaller than the fork itself';
        if (block.height !== height) throw "block height is different than block's height";

        let prevData = this._getForkPrevsData(height, forkHeight);

        if (blockValidationType === undefined)
            blockValidationType = prevData.blockValidationType;

        block.difficultyTargetPrev = prevData.prevDifficultyTarget;

        let result = await this.blockchain.validateBlockchainBlock(block, prevData.prevDifficultyTarget, prevData.prevHash, prevData.prevTimeStamp, blockValidationType );

        return result;

    }

    _getForkPrevsData(height, forkHeight){

        // transition from blockchain to fork
        if (height === 0)

            // based on genesis block
            return {
                prevDifficultyTarget : undefined,
                prevHash : undefined,
                prevTimeStamp : undefined,
                blockValidationType: {},
            };

        else if ( forkHeight === 0)

            // based on previous block from blockchain

            return {
                prevDifficultyTarget : this.blockchain.getDifficultyTarget(height),
                prevHash : this.blockchain.getHashPrev(height),
                prevTimeStamp : this.blockchain.getTimeStamp(height),
                blockValidationType:  {},
            };

        else  // just the fork

            return {
                prevDifficultyTarget : this.forkBlocks[forkHeight - 1].difficultyTarget,
                prevHash : this.forkBlocks[forkHeight - 1].hash,
                prevTimeStamp : this.forkBlocks[forkHeight - 1].timeStamp,
                blockValidationType: {},
            }

    }


    /**
     * Validate the Fork and Use the fork as main blockchain
     */
    async saveFork(){

        if (global.TERMINATED) return false;

        //overwrite the blockchain blocks with the forkBlocks

        console.log("save Fork before validateFork")
        if (!await this.validateFork()) {
            console.log(colors.red("validateFork was not passed"));
            return false
        }
        console.log("save Fork after validateFork")

        // to do

        let success = await this.blockchain.processBlocksSempahoreCallback( async () => {

            //making a copy of the current blockchain
            this._blocksCopy = [];
            for (let i = this.forkStartingHeight; i < this.blockchain.getBlockchainLength; i++) {
                this._blocksCopy.push(this.blockchain.blocks[i]);
                this.blockchain.blocks[i] = undefined;
            }

            this.preFork();

            this.blockchain.spliceBlocks(this.forkStartingHeight);

            let forkedSuccessfully = true;


            console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
            console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
            console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')

            try {

                for (let i = 0; i < this.forkBlocks.length; i++)
                    if (!await this.blockchain.includeBlockchainBlock(this.forkBlocks[i], false, "all", false, {})) {
                        console.log(colors.green("fork couldn't be included in main Blockchain ", i));
                        forkedSuccessfully = false;
                        break;
                    }

            } catch (exception){
                console.log(colors.red("saveFork includeBlockchainBlock1 raised exception"), exception);
                forkedSuccessfully = false;
            }


            await this.postForkBefore(forkedSuccessfully);

            //revert the last K blocks
            if (!forkedSuccessfully) {

                this.blockchain.spliceBlocks(this.forkStartingHeight);

                try {

                    for (let i = 0; i < this._blocksCopy.length; i++)
                        if (!await this.blockchain.includeBlockchainBlock( this._blocksCopy[i], false, "all", false, {})) {
                            console.log(colors.green("blockchain couldn't restored after fork included in main Blockchain ", i));
                            break;
                        }

                } catch (exception){
                    console.log(colors.red("saveFork includeBlockchainBlock2 raised exception"), exception);
                }
            }

            await this.postFork(forkedSuccessfully);

            //propagating valid blocks
            if (forkedSuccessfully) {
                await this.blockchain.save();
                this.blockchain.mining.resetMining();
            }

            return forkedSuccessfully;
        });

        // it was done successfully
        console.log("FORK SOLVER SUCCESS", success);
        if (success){

            //propagate last block
            this.blockchain.propagateBlocks( this.blockchain.blocks.length-1, this.sockets );

            //this.blockchain.propagateBlocks(this.forkStartingHeight, this.sockets);

        }

        return success;
    }



    preFork(){

    }


    postForkBefore(forkedSuccessfully){

    }

    postFork(forkedSuccessfully){

    }


}

export default InterfaceBlockchainFork;