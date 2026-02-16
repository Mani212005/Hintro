export interface MoveTargetInput {
  sameList: boolean;
  targetPosition: number;
  sourceCount: number;
  destinationCount: number;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(value, max));

export const calculateMoveTarget = (input: MoveTargetInput): number => {
  if (input.sameList) {
    return clamp(input.targetPosition, 0, Math.max(0, input.sourceCount - 1));
  }

  return clamp(input.targetPosition, 0, input.destinationCount);
};
