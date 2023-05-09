import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Button } from 'components/primitives'
import { ToastContext } from 'context/ToastContextProvider'
import { useMarketplaceChain } from 'hooks'
import { cloneElement, ComponentProps, FC, ReactNode, useContext } from 'react'
import { useAccount, useNetwork, useSigner, useSwitchNetwork } from 'wagmi'
import { CSS } from '@stitches/react'
import { SWRResponse } from 'swr'
import {
  EditListingModal,
  EditListingStep,
} from '@reservoir0x/reservoir-kit-ui'

type Props = {
  listingId?: string
  tokenId?: string
  collectionId?: string
  disabled?: boolean
  openState?: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
  buttonCss?: CSS
  buttonProps?: ComponentProps<typeof Button>
  buttonChildren?: ReactNode
  mutate?: SWRResponse['mutate']
}

const EditListing: FC<Props> = ({
  listingId,
  tokenId,
  collectionId,
  disabled,
  openState,
  buttonCss,
  buttonProps,
  buttonChildren,
  mutate,
}) => {
  const { isDisconnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { addToast } = useContext(ToastContext)
  const marketplaceChain = useMarketplaceChain()
  const { switchNetworkAsync } = useSwitchNetwork({
    chainId: marketplaceChain.id,
  })

  const { data: signer } = useSigner()
  const { chain: activeChain } = useNetwork()

  const isInTheWrongNetwork = Boolean(
    signer && marketplaceChain.id !== activeChain?.id
  )

  const trigger = (
    <Button css={buttonCss} disabled={disabled} {...buttonProps} color="gray3">
      {buttonChildren}
    </Button>
  )

  if (isDisconnected || isInTheWrongNetwork) {
    return cloneElement(trigger, {
      onClick: async () => {
        if (switchNetworkAsync && activeChain) {
          const chain = await switchNetworkAsync(marketplaceChain.id)
          if (chain.id !== marketplaceChain.id) {
            return false
          }
        }

        if (!signer) {
          openConnectModal?.()
        }
      },
    })
  } else
    return (
      <EditListingModal
        trigger={trigger}
        openState={openState}
        listingId={listingId}
        tokenId={tokenId}
        collectionId={collectionId}
        onClose={(data, currentStep) => {
          if (mutate && currentStep == EditListingStep.Complete) mutate()
        }}
        onEditListingError={(error: any) => {
          if (error?.code === 4001) {
            addToast?.({
              title: 'User canceled transaction',
              description: 'You have canceled the transaction.',
            })
            return
          }
          addToast?.({
            title: 'Could not edit listing',
            description: 'The transaction was not completed.',
          })
        }}
      />
    )
}

export default EditListing
