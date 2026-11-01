import AvatarCreator from "./AvatarCreator";

// The editor loads its wallet, catalogue and ownership from the backend.
export default function AvatarStudio({
  onBack,
  onXPChange,
  onWalletChange,
  initialTab,
}) {
  return (
    <AvatarCreator
      initialTab={initialTab}
      editing
      onBack={onBack}
      onWalletChange={(wallet) => {
        onXPChange?.(wallet.totalXP);
        onWalletChange?.(wallet);
      }}
    />
  );
}
