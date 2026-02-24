export async function softDelete(model, id, deletedById, status) {
  return model.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById, status },
  });
}
