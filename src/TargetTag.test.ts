import TargetTag from './TargetTag';

it('Should exist when found', () => {
  const tag = TargetTag.for('v1.2.3');
  tag.found();
  expect(tag.exists).toBeTruthy();
});

it('Should not exist when found', () => {
  const tag = TargetTag.for('v1.2.3');
  expect(tag.exists).toBeFalsy();
});

it('Should be published', () => {
  const tag = TargetTag.for('v1.2.3');
  tag.markPublished();
  expect(tag.isPublished).toBeTruthy();
});

it('Should not be published', () => {
  const tag = TargetTag.for('v1.2.3');
  expect(tag.isPublished).toBeFalsy();
});

it('Can upsert when overwritable but and not found', () => {
  const tag = TargetTag.for('v1.2.3', { canOverwrite: true });
  expect(tag.canUpsert).toBeTruthy();
});

it('Can upsert when overwritable but found', () => {
  const tag = TargetTag.for('v1.2.3', { canOverwrite: true });
  tag.found();
  expect(tag.canUpsert).toBeTruthy();
});

it('Can upsert when not overwritable and not found', () => {
  const tag = TargetTag.for('v1.2.3', { canOverwrite: false });
  expect(tag.canUpsert).toBeTruthy();
});

it('Cannot upsert when not overwritable but found', () => {
  const tag = TargetTag.for('v1.2.3');
  tag.found();
  expect(tag.canUpsert).toBeFalsy();
});

it('Should convert to tag name on toString', () => {
  const tag = TargetTag.for('v1.2.3');
  expect(tag.toString()).toBe('v1.2.3');
});
