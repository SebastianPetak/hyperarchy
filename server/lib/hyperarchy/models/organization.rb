class Organization < Monarch::Model::Record
  column :name, :string
  column :description, :string, :default => ""
  column :members_can_invite, :boolean, :default => false
  column :dismissed_welcome_guide, :boolean, :default => false
  column :use_ssl, :boolean, :default => true
  column :election_count, :integer, :default => 0
  column :member_count, :integer, :default => 0
  column :created_at, :datetime
  column :updated_at, :datetime
  column :social, :boolean, :default => false
  column :privacy, :string, :default => "private"
  column :invitation_code, :string

  has_many :elections, :order_by => "score desc"
  has_many :memberships

  relates_to_many :members do
    memberships.join_through(User)
  end

  attr_accessor :suppress_membership_creation

  def self.social
    find(:social => true)
  end

  def guest
    members.find(:guest => true)
  end

  def can_create?
    current_user && !current_user.guest?
  end

  def can_update_or_destroy?
    current_user.admin? || has_owner?(current_user)
  end
  alias can_update? can_update_or_destroy?
  alias can_destroy? can_update_or_destroy?

  def write_blacklist
    [:social]
  end

  def before_create
    self.invitation_code = SecureRandom.hex(8)
  end

  def after_create
    special_guest = User.create_guest(id)
    memberships.create(:user => special_guest, :pending => false)
    memberships.create(:user => current_user, :role => "owner", :pending => false) unless suppress_membership_creation
  end

  def has_member?(user)
    !memberships.find(:user_id => user.id).nil?
  end

  def current_user_is_member?
    has_member?(current_user)
  end

  def ensure_current_user_is_member
    raise Monarch::Unauthorized unless current_user
    return if current_user_is_member?
    raise Monarch::Unauthorized unless public?
    memberships.create!(:user => current_user, :pending => false)
  end

  def current_user_can_create_items?
    (public? && !current_user.guest?) || has_member?(current_user)
  end

  def has_owner?(user)
    !memberships.find(:user_id => user.id, :role => "owner").nil?
  end

  def current_user_is_owner?
    has_owner?(current_user)
  end

  def allow_subscription?(user)
    if public_readable?
      true
    else
      user.admin? || has_member?(user)
    end
  end

  def public?
    privacy == "public"
  end

  def public_readable?
    privacy == "public" || privacy == "read_only"
  end

  def private?
    privacy == "private"
  end

  def organization_ids
    [id]
  end
end
