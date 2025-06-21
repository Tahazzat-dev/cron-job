import User from "../models/User";
export const changeStatusController = async (req: any, res: any) => {

    const { userId, status } = req?.body || {};
    if (!userId || !status) {
        return res.status(400).json({ error: true, message: 'User ID and status are required' });
    }

const validStatuses = ['enabled', 'disabled', 'deleted', 'blocked']

if (!validStatuses.includes(status)) {
  return res.status(400).json({
    error: true,
    message: `Invalid status. Status should be : "enabled", "disabled", "deleted", "blocked".`,
  });
}
    try {
    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    res.json({ success:true, message: 'Status changed', userStatus: user.status });
  } catch (err) {
    res.status(500).json({ error: true, message: 'Server error' });
  }
};

export const logoutController = (req:any, res:any) => {
  res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'strict' });
  res.status(200).json({ message: 'Logged out' });
};